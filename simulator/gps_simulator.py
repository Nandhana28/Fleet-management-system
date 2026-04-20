import os, time, json, random, threading, math, requests, boto3, redis, uuid
from datetime import datetime

_redis_url = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6380/0')
redis_client = redis.from_url(_redis_url, decode_responses=True)

ORS_API_KEY = os.environ.get('ORS_API_KEY', '')
LOCALSTACK  = os.environ.get('LOCALSTACK_ENDPOINT', 'http://127.0.0.1:4566')
CHAOS_MODE  = True

ALL_VEHICLES = [f'vehicle-{i}' for i in range(1, 11)]

# Canonical landmark coordinates — used to correct stored task coords at runtime
LANDMARK_COORDS = {
    'Gandhipuram Bus Stand':  (11.0168, 76.9558),
    'Coimbatore Airport':     (11.0275, 77.0434),
    'RS Puram':               (10.9987, 76.9617),
    'Peelamedu':              (11.0167, 77.0081),
    'Ukkadam':                (10.9847, 76.9762),
    'Singanallur':            (11.0009, 77.0289),
    'Tidel Park':             (11.0130, 77.0147),
    'Podanur Junction':       (10.9704, 76.9605),
    'Saibaba Colony':         (11.0110, 76.9676),
    'Ganapathy':              (11.0228, 76.9632),
    'Race Course':            (11.0057, 76.9636),
    'Vadavalli':              (11.0236, 76.8929),
    'Hopes College':          (11.0168, 76.9543),
    'Kuniyamuthur':           (10.9580, 76.9740),
    'Kovaipudur':             (10.9467, 76.9512),
    'Thondamuthur':           (10.9748, 76.8711),
    'Sulur':                  (11.0302, 77.1200),
    'Kaniyur':                (11.0390, 77.0560),
    'Mettupalayam Road':      (11.0600, 76.9380),
    'Avinashi Road':          (11.0458, 77.0189),
    'Town Hall':              (11.0024, 76.9660),
    'CODISSIA':               (11.0302, 77.0327),
    'Brookefields Mall':      (11.0205, 77.0059),
    'Prozone Mall':           (11.0152, 77.0147),
    'Coimbatore Junction':    (11.0021, 76.9689),
}

TRAFFIC_ZONES = [
    {'center': (11.0168, 76.9558), 'radius': 0.005, 'name': 'Gandhipuram'},
    {'center': (11.0050, 76.9650), 'radius': 0.004, 'name': 'Race Course'},
    {'center': (10.9987, 76.9508), 'radius': 0.003, 'name': 'RS Puram'},
    {'center': (11.0130, 77.0180), 'radius': 0.004, 'name': 'Tidel Park'},
    {'center': (10.9847, 76.9762), 'radius': 0.003, 'name': 'Ukkadam'},
    {'center': (11.0010, 76.9686), 'radius': 0.005, 'name': 'Town Hall'},
]

SPEED_ZONES = [
    {'center': (11.0168, 76.9558), 'radius': 0.003, 'max_speed': 20, 'name': 'School Zone'},
    {'center': (11.0275, 77.0433), 'radius': 0.002, 'max_speed': 15, 'name': 'Airport Zone'},
    {'center': (10.9847, 76.9762), 'radius': 0.002, 'max_speed': 25, 'name': 'Market Zone'},
]

TRAFFIC_SCHEDULE = {
    range(0, 6):   1.2,
    range(6, 9):   0.45,
    range(9, 12):  0.80,
    range(12, 14): 0.60,
    range(14, 17): 0.85,
    range(17, 20): 0.40,
    range(20, 24): 1.0,
}


def get_traffic_multiplier(lat, lon):
    hour = datetime.now().hour
    time_mult = 1.0
    for hours, mult in TRAFFIC_SCHEDULE.items():
        if hour in hours:
            time_mult = mult
            break
    loc_mult = 1.0
    for zone in TRAFFIC_ZONES:
        dist = math.sqrt((lat - zone['center'][0])**2 + (lon - zone['center'][1])**2)
        if dist < zone['radius']:
            congestion = 1 - (dist / zone['radius'])
            loc_mult = min(loc_mult, 1 - congestion * 0.5)
    return round(time_mult * loc_mult * random.uniform(0.85, 1.15), 2)


def get_speed_limit(lat, lon):
    for zone in SPEED_ZONES:
        dist = math.sqrt((lat - zone['center'][0])**2 + (lon - zone['center'][1])**2)
        if dist < zone['radius']:
            return zone['max_speed'], zone['name']
    return 80, None


def get_road_route(start, end):
    """Fetch a full-detail road route from OSRM. Falls back to straight-line on error."""
    try:
        url = (
            f"http://router.project-osrm.org/route/v1/driving/"
            f"{start[1]},{start[0]};{end[1]},{end[0]}"
            f"?overview=full&geometries=geojson&steps=false"
        )
        resp = requests.get(url, timeout=8)
        data = resp.json()
        if data.get('code') != 'Ok':
            print(f"[OSRM] Bad response: {data.get('code')} — falling back")
            return get_simulated_route(start, end)

        coords = data['routes'][0]['geometry']['coordinates']  # [[lon, lat], ...]
        wps = [(round(c[1], 6), round(c[0], 6)) for c in coords]
        print(f"[OSRM] {len(wps)} road waypoints fetched")
        return wps
    except Exception as e:
        print(f"[OSRM] Error: {e} — falling back")
        return get_simulated_route(start, end)


def get_simulated_route(start, end):
    """Straight-line fallback: 25 evenly-spaced waypoints."""
    wps = [start]
    steps = 25
    for i in range(1, steps):
        f = i / steps
        lat = start[0] + (end[0] - start[0]) * f
        lon = start[1] + (end[1] - start[1]) * f
        wps.append((round(lat, 6), round(lon, 6)))
    wps.append(end)
    return wps


def inject_chaos(speed, fuel, speed_limit, last_chaos_alert=None):
    # 1-in-12 chance of any anomaly per waypoint (reduced from 2-in-7)
    anomaly = random.choice(['n'] * 14 + ['overspeed', 'fuel_theft', 'sos'])
    alert_type = None
    if anomaly == 'overspeed':
        speed = round(random.uniform(speed_limit + 10, speed_limit + 30), 2)
        alert_type = 'OVERSPEEDING'
        print(f' CHAOS overspeed {speed} (limit {speed_limit})')
    elif anomaly == 'fuel_theft':
        # Respect cooldown on the actual fuel modification too (not just alerts)
        now_ts = time.time()
        last = (last_chaos_alert or {}).get('FUEL_THEFT', 0)
        if now_ts - last > 120:
            fuel = round(fuel - random.uniform(3, 8), 2)  # reduced from 10-20%
            alert_type = 'FUEL_THEFT'
            print(f' CHAOS fuel theft  {fuel}%')
    elif anomaly == 'sos':
        now_ts = time.time()
        last = (last_chaos_alert or {}).get('SOS', 0)
        if now_ts - last > 300:  # 5 min cooldown between SOS events
            alert_type = 'SOS'
            print(f' CHAOS SOS triggered')
    return speed, fuel, alert_type


def create_alert(vehicle_id, driver_id, alert_type, speed=None, fuel=None, lat=None, lon=None):
    """Write anomaly alert to DynamoDB."""
    try:
        import uuid
        db = boto3.resource('dynamodb', endpoint_url=LOCALSTACK,
                            region_name='ap-south-1',
                            aws_access_key_id='test', aws_secret_access_key='test')
        db.Table('Alerts').put_item(Item={
            'alert_id':   str(uuid.uuid4()),
            'vehicle_id': vehicle_id,
            'driver_id':  driver_id,
            'alert_type': alert_type,
            'severity':   'high' if alert_type in ('SOS', 'FUEL_THEFT') else 'medium',
            'status':     'active',
            'resolved':   False,
            'timestamp':  datetime.utcnow().isoformat(),
            'message':    f'{alert_type} detected on {vehicle_id}',
            'latitude':   str(lat or ''),
            'longitude':  str(lon or ''),
        })
    except Exception as e:
        print(f'[Alert] DB write failed: {e}')


def notify_in_app(vehicle_id, message, event_type='info'):
    """Push notification to Redis for frontend polling."""
    try:
        notif = {
            'id':         f'notif-{int(time.time())}-{vehicle_id}',
            'vehicle_id': vehicle_id,
            'message':    message,
            'type':       event_type,
            'timestamp':  datetime.utcnow().isoformat(),
            'read':       False,
        }
        redis_client.lpush('notifications', json.dumps(notif))
        redis_client.ltrim('notifications', 0, 49)  # keep last 50
    except Exception as e:
        print(f'[Notif] {e}')


def send_sos_whatsapp(vehicle_id, lat, lon):
    """SOS only  send WhatsApp."""
    try:
        db = boto3.resource('dynamodb', endpoint_url=LOCALSTACK,
                            region_name='ap-south-1',
                            aws_access_key_id='test', aws_secret_access_key='test')
        resp = db.Table('AgentConfig').scan()
        for item in resp.get('Items', []):
            phone = item.get('notifications', {}).get('whatsapp', '')
            if phone:
                normalized = phone.strip()
                if not normalized.startswith('+'):
                    normalized = f'+91{normalized}'
                sid   = os.environ.get('TWILIO_ACCOUNT_SID', '')
                token = os.environ.get('TWILIO_AUTH_TOKEN', '')
                if sid and token:
                    from twilio.rest import Client
                    Client(sid, token).messages.create(
                        body=(
                            f' *EMERGENCY SOS  FleetPulse*\n'
                            f'Vehicle: {vehicle_id}\n'
                            f'Location: {lat}, {lon}\n'
                            f'https://maps.google.com/?q={lat},{lon}\n'
                            f'Respond immediately!'
                        ),
                        from_='whatsapp:+14155238886',
                        to=f'whatsapp:{normalized}',
                    )
                    print(f'[SOS WA] Sent for {vehicle_id}')
                break
    except Exception as e:
        print(f'[SOS WA] {e}')


def get_active_task(vehicle_id):
    # Fast path  Redis
    raw = redis_client.get(f'task:{vehicle_id}:active')
    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass

    # Fallback  scan DynamoDB directly (handles backend Redis write failures)
    try:
        db = boto3.resource('dynamodb', endpoint_url=LOCALSTACK,
                            region_name='ap-south-1',
                            aws_access_key_id='test', aws_secret_access_key='test')
        resp = db.Table('Tasks').scan(
            FilterExpression='vehicle_id = :vid AND #s = :s',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':vid': vehicle_id, ':s': 'active'},
        )
        items = resp.get('Items', [])
        if items:
            t = items[0]
            task_data = {
                'task_id':      t.get('task_id'),
                'vehicle_id':   vehicle_id,
                'driver_id':    t.get('driver_id', f'driver-{vehicle_id.split("-")[1]}'),
                'source':       t.get('source'),
                'dest':         t.get('dest'),
                'start_coords': [float(c) for c in t.get('start_coords', [0, 0])],
                'end_coords':   [float(c) for c in t.get('end_coords', [0, 0])],
                'priority':     t.get('priority', 'medium'),
            }
            # Cache in Redis so next iteration is fast
            redis_client.set(f'task:{vehicle_id}:active', json.dumps(task_data))
            print(f'[Task] {vehicle_id} picked up task from DynamoDB (Redis miss)')
            return task_data
    except Exception as e:
        print(f'[Task] DynamoDB fallback failed for {vehicle_id}: {e}')

    return None


def write_location(vehicle_id, lat, lon, speed, fuel, status,
                   source, dest, progress, odometer=0, driver_fatigue=0):
    try:
        location_data = {
            'latitude':       lat,
            'longitude':      lon,
            'speed':          speed,
            'fuel_level':     round(fuel, 1),
            'status':         status,
            'timestamp':      datetime.utcnow().isoformat(),
            'source':         source,
            'dest':           dest,
            'progress':       progress,
            'odometer':       round(odometer, 1),
            'driver_fatigue': driver_fatigue,
        }
        
        # Write to Redis for real-time dashboard
        redis_client.setex(
            f'vehicle:{vehicle_id}:location', 86400,
            json.dumps(location_data)
        )
        
        # Push to Kinesis for pipeline processing
        try:
            kinesis = boto3.client('kinesis', endpoint_url=LOCALSTACK,
                                   region_name='ap-south-1',
                                   aws_access_key_id='test', aws_secret_access_key='test')
            payload = {
                'vehicle_id': vehicle_id,
                **location_data
            }
            kinesis.put_record(
                StreamName='fleet-gps-stream',
                Data=json.dumps(payload),
                PartitionKey=vehicle_id
            )
        except Exception as ke:
            pass  # Kinesis optional  don't block on it
            
    except Exception as e:
        print(f' Redis {vehicle_id}: {e}')


def mark_task_complete(vehicle_id, task_id):
    try:
        db = boto3.resource('dynamodb', endpoint_url=LOCALSTACK,
                            region_name='ap-south-1',
                            aws_access_key_id='test', aws_secret_access_key='test')
        db.Table('Tasks').update_item(
            Key={'task_id': task_id},
            UpdateExpression='SET #s = :s, completed_at = :t',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={
                ':s': 'completed',
                ':t': datetime.utcnow().isoformat(),
            }
        )
        redis_client.delete(f'task:{vehicle_id}:active')

        # Clear location to idle state  no route, no progress
        existing = redis_client.get(f'vehicle:{vehicle_id}:location')
        if existing:
            data = json.loads(existing)
            data.update({
                'status':   'idle',
                'speed':    0,
                'source':   '',
                'dest':     '',
                'progress': 0,
                'timestamp': datetime.utcnow().isoformat(),
            })
            redis_client.setex(f'vehicle:{vehicle_id}:location', 86400, json.dumps(data))

        # Clear route from Redis too
        redis_client.delete(f'vehicle:{vehicle_id}:route')

        print(f'[Task] {task_id} completed and location cleared')
    except Exception as e:
        print(f'[Task] Complete failed: {e}')


def push_seeded_tasks_to_redis():
    try:
        db = boto3.resource('dynamodb', endpoint_url=LOCALSTACK,
                            region_name='ap-south-1',
                            aws_access_key_id='test', aws_secret_access_key='test')
        resp = db.Table('Tasks').scan()
        count = 0
        for t in resp.get('Items', []):
            if t.get('status') == 'active':
                vid = t.get('vehicle_id', '')
                if vid:
                    redis_client.set(f'task:{vid}:active', json.dumps({
                        'task_id':      t.get('task_id'),
                        'vehicle_id':   vid,
                        'driver_id':    t.get('driver_id'),
                        'source':       t.get('source'),
                        'dest':         t.get('dest'),
                        'start_coords': [float(c) for c in t.get('start_coords', [0, 0])],
                        'end_coords':   [float(c) for c in t.get('end_coords', [0, 0])],
                        'priority':     t.get('priority', 'medium'),
                    }))
                    count += 1
        print(f'[Startup] Pushed {count} active tasks to Redis')
    except Exception as e:
        print(f'[Startup] Task push failed: {e}')


def simulate_vehicle(vehicle_id: str):
    # Seed fuel and odometer from Redis so values persist across trips
    _seed = redis_client.get(f'vehicle:{vehicle_id}:location')
    if _seed:
        _d = json.loads(_seed)
        fuel     = float(_d.get('fuel_level', round(random.uniform(75, 100), 2)))
        odometer = float(_d.get('odometer',   round(random.uniform(10000, 80000), 1)))
    else:
        fuel     = round(random.uniform(75, 100), 2)
        odometer = round(random.uniform(10000, 80000), 1)
    fatigue  = 0
    last_chaos_alert: dict[str, float] = {}

    print(f' {vehicle_id} thread started')

    while True:
        # SOS lock  freeze completely
        if redis_client.get(f'vehicle:{vehicle_id}:sos_lock'):
            time.sleep(2)
            continue

        task = get_active_task(vehicle_id)

        if not task:
            # No task  stay idle
            existing = redis_client.get(f'vehicle:{vehicle_id}:location')
            if existing:
                data = json.loads(existing)
                if data.get('status') not in ('sos',):
                    data.update({'status': 'idle', 'speed': 0,
                                 'timestamp': datetime.utcnow().isoformat()})
                    redis_client.setex(f'vehicle:{vehicle_id}:location', 86400, json.dumps(data))
            time.sleep(5)
            continue

        source  = task['source']
        dest    = task['dest']
        # Always use canonical landmark coords — stored start/end_coords may be wrong
        start   = LANDMARK_COORDS.get(source) or tuple(task['start_coords'])
        end     = LANDMARK_COORDS.get(dest)   or tuple(task['end_coords'])
        task_id = task.get('task_id', '')
        driver_id = task.get('driver_id', f'driver-{vehicle_id.split("-")[1]}')

        print(f'[Route] {vehicle_id}: {source} to {dest}')
        waypoints  = get_road_route(start, end)
        reverse_wps = list(reversed(waypoints))

        redis_client.set(f'vehicle:{vehicle_id}:route', json.dumps({
            'source': source, 'dest': dest,
            'waypoints': waypoints,
        }))

        #  Forward trip 
        wp_index = 0
        signal_cooldown = 0

        while wp_index < len(waypoints):
            if redis_client.get(f'vehicle:{vehicle_id}:sos_lock'):
                time.sleep(2)
                continue

            current_task = get_active_task(vehicle_id)
            if not current_task or current_task.get('task_id') != task_id:
                print(f'[Task] {vehicle_id} task changed')
                break

            lat, lon = waypoints[wp_index]

            traffic_mult = get_traffic_multiplier(lat, lon)
            speed_limit, speed_zone = get_speed_limit(lat, lon)
            base_speed = random.uniform(30, 55) * traffic_mult
            speed = round(max(5, min(speed_limit, base_speed)), 2)

            # ~0.04% per waypoint → ~12% per 300-waypoint trip (realistic city consumption)
            fuel_burn = random.uniform(0.03, 0.05) * (1 + (1 - traffic_mult) * 0.2)
            fuel = round(fuel - fuel_burn, 2)

            # ── In-route refuel at 5% ──────────────────────────────────────
            if fuel <= 20:
                write_location(vehicle_id, lat, lon, 0, fuel,
                               'idle', source, dest,
                               round((wp_index / max(len(waypoints) - 1, 1)) * 50, 1),
                               odometer, round(fatigue))
                notify_in_app(vehicle_id, f'{vehicle_id} pulling over to refuel — {fuel:.1f}% remaining', 'warning')
                print(f'[Fuel] {vehicle_id} refuelling en route at waypoint {wp_index}')
                time.sleep(10)  # refuel stop
                fuel = round(random.uniform(75, 95), 2)
                notify_in_app(vehicle_id, f'{vehicle_id} refuelled to {fuel:.0f}% — continuing', 'success')
                print(f'[Fuel] {vehicle_id} refuelled to {fuel}%')

            # ── Fuel exhausted → auto SOS ──────────────────────────────────
            if fuel <= 0:
                fuel = 0
                write_location(vehicle_id, lat, lon, 0, fuel, 'sos', source, dest,
                               round((wp_index / max(len(waypoints) - 1, 1)) * 50, 1),
                               odometer, round(fatigue))
                create_alert(vehicle_id, driver_id, 'SOS', speed=0, fuel=0, lat=lat, lon=lon)
                notify_in_app(vehicle_id, f'FUEL EMPTY — automatic SOS triggered for {vehicle_id}', 'alert')
                redis_client.set(f'vehicle:{vehicle_id}:sos_lock', '1', ex=86400)
                print(f'[SOS] {vehicle_id} fuel exhausted — SOS triggered')
                break

            # Odometer
            if wp_index > 0:
                prev = waypoints[wp_index - 1]
                dist = math.sqrt((lat - prev[0])**2 + (lon - prev[1])**2) * 111
                odometer += dist

            # Driver fatigue  every 120 min, speed drops
            fatigue += 0.5  # 0.5 min per step → ~150 min for a full 300-wp trip
            if fatigue > 120:
                speed = round(speed * 0.75, 2)
                if random.random() < 0.01:
                    notify_in_app(vehicle_id, f'{vehicle_id} driver fatigue detected  driving slow', 'warning')

            # Chaos
            alert_type = None
            if CHAOS_MODE:
                speed, fuel, alert_type = inject_chaos(speed, fuel, speed_limit, last_chaos_alert)
                if alert_type:
                    now_ts = time.time()
                    cooldown = 300 if alert_type == 'SOS' else 120
                    last = last_chaos_alert.get(alert_type, 0)
                    if now_ts - last > cooldown:
                        create_alert(vehicle_id, driver_id, alert_type, speed, fuel, lat, lon)
                        if alert_type == 'SOS':
                            notify_in_app(vehicle_id, f'SOS alert from {vehicle_id}  emergency!', 'alert')
                        elif alert_type == 'OVERSPEEDING':
                            notify_in_app(vehicle_id, f'{alert_type} on {vehicle_id}  speed {speed} km/h', 'alert')
                        else:
                            notify_in_app(vehicle_id, f'Fuel theft suspected on {vehicle_id}', 'alert')
                        last_chaos_alert[alert_type] = now_ts

            # Traffic signal stop
            if signal_cooldown > 0:
                signal_cooldown -= 1
            elif traffic_mult < 0.55 and random.random() < 0.12:
                signal_wait = random.randint(3, 8)
                speed = 0
                signal_cooldown = signal_wait
                print(f' {vehicle_id} red light ({signal_wait}s)')

            status   = 'sos' if alert_type == 'SOS' else ('moving' if speed > 5 else 'idle')
            progress = round((wp_index / max(len(waypoints) - 1, 1)) * 50, 1)

            if speed_zone and speed > speed_limit:
                notify_in_app(vehicle_id, f'{vehicle_id} speeding in {speed_zone}', 'alert')

            write_location(vehicle_id, lat, lon, speed, fuel,
                           status, source, dest, progress, odometer, round(fatigue))

            print(f' {vehicle_id} | {progress:.0f}% | {speed}km/h | fuel={fuel:.1f}% | odo={odometer:.0f}km')

            advance = 1
            wp_index += advance
            time.sleep(0.3)

        # Arrived at destination  50% of round trip done
        dest_pos = waypoints[-1]
        write_location(vehicle_id, dest_pos[0], dest_pos[1], 0, fuel,
                       'idle', dest, dest, 50, odometer, round(fatigue))
        notify_in_app(vehicle_id, f'{vehicle_id} arrived at {dest}', 'success')
        print(f'[Trip] {vehicle_id} arrived at {dest}')

        # Refuel at destination if low
        if fuel < 25:
            fuel = round(random.uniform(70, 100), 2)
            notify_in_app(vehicle_id, f'{vehicle_id} refuelled at {dest}  {fuel}%', 'info')
            print(f' {vehicle_id} refuelled  {fuel}%')

        # Fatigue reset at destination (driver rest)
        fatigue = 0

        rest = random.randint(5, 10)
        print(f'  {vehicle_id} resting {rest}s')
        time.sleep(rest)

        #  Return trip 
        redis_client.set(f'vehicle:{vehicle_id}:route', json.dumps({
            'source': dest, 'dest': source,
            'waypoints': reverse_wps,
        }))

        wp_index = 0
        signal_cooldown = 0

        while wp_index < len(reverse_wps):
            if redis_client.get(f'vehicle:{vehicle_id}:sos_lock'):
                time.sleep(2)
                continue

            current_task = get_active_task(vehicle_id)
            if not current_task or current_task.get('task_id') != task_id:
                break

            lat, lon = reverse_wps[wp_index]

            traffic_mult = get_traffic_multiplier(lat, lon)
            speed_limit, _ = get_speed_limit(lat, lon)
            base_speed = random.uniform(30, 55) * traffic_mult
            speed = round(max(5, min(speed_limit, base_speed)), 2)

            fuel_burn = random.uniform(0.03, 0.05) * (1 + (1 - traffic_mult) * 0.2)
            fuel = round(fuel - fuel_burn, 2)

            # ── In-route refuel at 5% ──────────────────────────────────────
            if fuel <= 20:
                write_location(vehicle_id, lat, lon, 0, fuel, 'idle', dest, source,
                               round(50 + (wp_index / max(len(reverse_wps) - 1, 1)) * 50, 1),
                               odometer, round(fatigue))
                notify_in_app(vehicle_id, f'{vehicle_id} pulling over to refuel — {fuel:.1f}% remaining', 'warning')
                print(f'[Fuel] {vehicle_id} refuelling en route (return leg) at waypoint {wp_index}')
                time.sleep(10)
                fuel = round(random.uniform(75, 95), 2)
                notify_in_app(vehicle_id, f'{vehicle_id} refuelled to {fuel:.0f}% — continuing', 'success')
                print(f'[Fuel] {vehicle_id} refuelled to {fuel}%')

            # ── Fuel exhausted → auto SOS ──────────────────────────────────
            if fuel <= 0:
                fuel = 0
                write_location(vehicle_id, lat, lon, 0, fuel, 'sos', dest, source,
                               round(50 + (wp_index / max(len(reverse_wps) - 1, 1)) * 50, 1),
                               odometer, round(fatigue))
                create_alert(vehicle_id, driver_id, 'SOS', speed=0, fuel=0, lat=lat, lon=lon)
                notify_in_app(vehicle_id, f'FUEL EMPTY — automatic SOS triggered for {vehicle_id}', 'alert')
                redis_client.set(f'vehicle:{vehicle_id}:sos_lock', '1', ex=86400)
                print(f'[SOS] {vehicle_id} fuel exhausted — SOS triggered')
                break

            if wp_index > 0:
                prev = reverse_wps[wp_index - 1]
                dist = math.sqrt((lat - prev[0])**2 + (lon - prev[1])**2) * 111
                odometer += dist

            fatigue += 0.5  # 0.5 min per step → ~150 min for a full 300-wp trip

            alert_type = None
            if CHAOS_MODE:
                speed, fuel, alert_type = inject_chaos(speed, fuel, speed_limit, last_chaos_alert)
                if alert_type:
                    now_ts = time.time()
                    last = last_chaos_alert.get(alert_type, 0)
                    if now_ts - last > 120:
                        create_alert(vehicle_id, driver_id, alert_type, speed, fuel, lat, lon)
                        notify_in_app(vehicle_id, f'{alert_type} on {vehicle_id}', 'alert')
                        last_chaos_alert[alert_type] = now_ts

            if signal_cooldown > 0:
                signal_cooldown -= 1
            elif traffic_mult < 0.55 and random.random() < 0.12:
                signal_wait = random.randint(3, 8)
                speed = 0
                signal_cooldown = signal_wait

            status   = 'moving' if speed > 5 else 'idle'
            progress = round(50 + (wp_index / max(len(reverse_wps) - 1, 1)) * 50, 1)

            write_location(vehicle_id, lat, lon, speed, fuel,
                           status, dest, source, progress, odometer, round(fatigue))

            print(f' {vehicle_id} return | {progress:.0f}% | {speed}km/h | fuel={fuel:.1f}%')

            advance = 1
            wp_index += advance
            time.sleep(0.3)

        # Back at source - round trip complete
        origin_pos = reverse_wps[-1]
        write_location(vehicle_id, origin_pos[0], origin_pos[1], 0, fuel,
                       'idle', source, source, 100, odometer, 0)

        notify_in_app(vehicle_id, f'{vehicle_id} trip complete', 'success')
        print(f'[Done] {vehicle_id} task complete')

        mark_task_complete(vehicle_id, task_id)
        fatigue = 0


def clear_stale_sos_locks():
    """Clear SOS locks left from previous runs so vehicles can resume."""
    for vid in ALL_VEHICLES:
        redis_client.delete(f'vehicle:{vid}:sos_lock')
    print('[Startup] Cleared stale SOS locks')


def clear_stale_task_keys():
    """Clear any Redis task keys from previous runs  vehicles start idle until trips are assigned."""
    for vid in ALL_VEHICLES:
        redis_client.delete(f'task:{vid}:active')
    print('[Startup] Cleared stale task keys  all vehicles start idle')


def init_vehicle_positions():
    """Initialize all vehicles with random starting positions."""
    landmarks_list = [
        ('Gandhipuram Bus Stand', (11.0168, 76.9558)),
        ('Coimbatore Airport',   (11.0275, 77.0434)),
        ('RS Puram',             (10.9987, 76.9617)),
        ('Peelamedu',            (11.0167, 77.0081)),
        ('Ukkadam',              (10.9847, 76.9762)),
        ('Singanallur',          (11.0009, 77.0289)),
        ('Tidel Park',           (11.0130, 77.0147)),
        ('Podanur Junction',     (10.9704, 76.9605)),
        ('Saibaba Colony',       (11.0110, 76.9676)),
        ('Ganapathy',            (11.0228, 76.9632)),
    ]

    for idx, vid in enumerate(ALL_VEHICLES):
        landmark, coords = landmarks_list[idx % len(landmarks_list)]
        lat, lon = coords
        location_data = {
            'latitude': lat,
            'longitude': lon,
            'speed': 0,
            'fuel_level': round(random.uniform(60, 100), 1),
            'status': 'idle',
            'timestamp': datetime.utcnow().isoformat(),
            'source': '',
            'dest': '',
            'progress': 0,
            'odometer': round(random.uniform(10000, 80000), 1),
            'driver_fatigue': 0,
        }
        redis_client.setex(f'vehicle:{vid}:location', 86400, json.dumps(location_data))

    print(f'[Startup] Initialized {len(ALL_VEHICLES)} vehicle positions')


def main():
    print('FleetPulse GPS Simulator Starting...')
    print(f'Chaos: {"ON" if CHAOS_MODE else "OFF"}')
    print(f'ORS: {"ENABLED" if ORS_API_KEY else "SIMULATED"}\n')

    clear_stale_sos_locks()
    clear_stale_task_keys()
    init_vehicle_positions()
    push_seeded_tasks_to_redis()

    for vid in ALL_VEHICLES:
        t = threading.Thread(target=simulate_vehicle, args=(vid,), daemon=True)
        t.start()
        time.sleep(0.2)

    print(f' {len(ALL_VEHICLES)} vehicle threads started\n')

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print('\n Simulator stopped')


if __name__ == '__main__':
    main()