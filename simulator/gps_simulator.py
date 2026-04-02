import time
import json
import random
import threading
import boto3
from datetime import datetime

# ─── AWS SQS Configuration ───────────────────────────────────────────────────
SQS_QUEUE_URL = (
    "https://sqs.ap-south-1.amazonaws.com/" "746491203215/fleetpulse-gps-queue"
)
sqs_client = boto3.client("sqs", region_name="ap-south-1")

# ─── Coimbatore GPS Boundaries ───────────────────────────────────────────────
COIMBATORE_BOUNDS = {
    "lat_min": 10.9800,
    "lat_max": 11.0800,
    "lon_min": 76.9200,
    "lon_max": 77.0200,
}

# ─── 10 Vehicles Configuration ───────────────────────────────────────────────
VEHICLES = [
    {"vehicle_id": f"vehicle-{i}", "driver_id": f"driver-{i}"} for i in range(1, 11)
]

# ─── Chaos Mode Flag ─────────────────────────────────────────────────────────
CHAOS_MODE = True


# ─── Helper Functions ─────────────────────────────────────────────────────────
def get_random_coimbatore_location():
    """Generate random GPS coordinates within Coimbatore city"""
    lat = random.uniform(COIMBATORE_BOUNDS["lat_min"], COIMBATORE_BOUNDS["lat_max"])
    lon = random.uniform(COIMBATORE_BOUNDS["lon_min"], COIMBATORE_BOUNDS["lon_max"])
    return round(lat, 6), round(lon, 6)


def get_normal_speed():
    """Normal city driving speed — 20 to 60 km/h"""
    return round(random.uniform(20, 60), 2)


def get_normal_fuel():
    """Normal fuel level — 30% to 100%"""
    return round(random.uniform(30, 100), 2)


def inject_chaos(speed, fuel):
    """Randomly inject anomalies for ML testing"""
    anomaly_type = random.choice(
        [
            "normal",
            "normal",
            "normal",
            "overspeed",
            "fuel_theft",
        ]
    )

    if anomaly_type == "overspeed":
        speed = round(random.uniform(85, 120), 2)
        print(f"🚨 CHAOS: Overspeeding injected — {speed} km/h")

    elif anomaly_type == "fuel_theft":
        fuel = round(fuel - random.uniform(15, 30), 2)
        fuel = max(0, fuel)
        print(f"🚨 CHAOS: Fuel theft injected — fuel dropped to {fuel}%")

    return speed, fuel


# ─── Vehicle Simulator ────────────────────────────────────────────────────────
def simulate_vehicle(vehicle):
    """Simulate a single vehicle sending GPS data every 2 seconds"""
    vehicle_id = vehicle["vehicle_id"]
    driver_id = vehicle["driver_id"]

    lat, lon = get_random_coimbatore_location()
    fuel = get_normal_fuel()

    print(f"🚗 Starting simulation for {vehicle_id}")

    while True:
        # Move vehicle slightly
        lat += random.uniform(-0.001, 0.001)
        lon += random.uniform(-0.001, 0.001)

        # Keep within Coimbatore bounds
        lat = max(COIMBATORE_BOUNDS["lat_min"], min(COIMBATORE_BOUNDS["lat_max"], lat))
        lon = max(COIMBATORE_BOUNDS["lon_min"], min(COIMBATORE_BOUNDS["lon_max"], lon))

        speed = get_normal_speed()
        fuel = max(0, fuel - random.uniform(0.1, 0.5))

        if CHAOS_MODE:
            speed, fuel = inject_chaos(speed, fuel)

        payload = {
            "vehicle_id": vehicle_id,
            "driver_id": driver_id,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "speed": speed,
            "fuel_level": round(fuel, 2),
            "timestamp": datetime.utcnow().isoformat(),
            "status": "moving" if speed > 0 else "idle",
        }

        # Send to SQS
        try:
            sqs_client.send_message(
                QueueUrl=SQS_QUEUE_URL,
                MessageBody=json.dumps(payload),
            )
            print(
                f"📍 {vehicle_id} | "
                f"lat={payload['latitude']} "
                f"lon={payload['longitude']} | "
                f"speed={speed} km/h | "
                f"fuel={fuel:.1f}% | "
                f"✅ SQS sent"
            )
        except Exception as e:
            print(f"❌ SQS error for {vehicle_id}: {str(e)}")

        time.sleep(2)


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("🚀 FleetPulse GPS Simulator Starting...")
    print(f"📡 Sending to SQS: {SQS_QUEUE_URL}")
    print(f"💥 Chaos Mode: {'ON' if CHAOS_MODE else 'OFF'}")
    print(f"🚗 Simulating {len(VEHICLES)} vehicles in Coimbatore\n")

    # Start one thread per vehicle
    threads = []
    for vehicle in VEHICLES:
        t = threading.Thread(target=simulate_vehicle, args=(vehicle,), daemon=True)
        threads.append(t)
        t.start()
        time.sleep(0.1)

    print(f"\n✅ All {len(VEHICLES)} vehicle threads started!\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Simulator stopped by user")


if __name__ == "__main__":
    main()
