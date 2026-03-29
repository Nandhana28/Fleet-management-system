import time
import json
import random
import threading
from datetime import datetime
import paho.mqtt.client as mqtt
from faker import Faker

fake = Faker()

# ─── Coimbatore GPS Boundaries ───────────────────────────────────────────────
# Real coordinates around Coimbatore city
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

# ─── AWS IoT Core Configuration ──────────────────────────────────────────────
MQTT_BROKER = "localhost"  # LocalStack for now
MQTT_PORT = 1883
USE_LOCAL = False  # Skip MQTT, just print locally for now
MQTT_TOPIC = "fleetpulse/gps"

# ─── Chaos Mode Flag ─────────────────────────────────────────────────────────
CHAOS_MODE = True  # Set to False for normal simulation


# ─── Helper Functions ─────────────────────────────────────────────────────────
def get_random_coimbatore_location():
    """Generate random GPS coordinates within Coimbatore city"""
    lat = random.uniform(COIMBATORE_BOUNDS["lat_min"], COIMBATORE_BOUNDS["lat_max"])
    lon = random.uniform(COIMBATORE_BOUNDS["lon_min"], COIMBATORE_BOUNDS["lon_max"])
    return round(lat, 6), round(lon, 6)


def get_normal_speed():
    """Normal city driving speed in Coimbatore — 20 to 60 km/h"""
    return round(random.uniform(20, 60), 2)


def get_normal_fuel():
    """Normal fuel level — 30% to 100%"""
    return round(random.uniform(30, 100), 2)


def inject_chaos(speed, fuel):
    """
    Chaos mode — randomly inject anomalies for ML testing
    3 types of anomalies:
    1. Overspeeding — speed > 80 km/h
    2. Fuel theft — sudden fuel drop > 15%
    3. Both at same time
    """
    anomaly_type = random.choice(
        [
            "normal",
            "normal",
            "normal",  # 60% chance normal
            "overspeed",  # 20% chance overspeed
            "fuel_theft",  # 20% chance fuel theft
        ]
    )

    if anomaly_type == "overspeed":
        speed = round(random.uniform(85, 120), 2)
        print(f"🚨 CHAOS: Overspeeding injected — {speed} km/h")

    elif anomaly_type == "fuel_theft":
        fuel = round(fuel - random.uniform(15, 30), 2)
        fuel = max(0, fuel)  # Don't go below 0
        print(f"🚨 CHAOS: Fuel theft injected — fuel dropped to {fuel}%")

    return speed, fuel


# ─── Vehicle Simulator ────────────────────────────────────────────────────────
def simulate_vehicle(vehicle, client):
    """
    Simulate a single vehicle sending GPS data every 2 seconds
    Each vehicle runs in its own thread
    """
    vehicle_id = vehicle["vehicle_id"]
    driver_id = vehicle["driver_id"]

    # Starting location
    lat, lon = get_random_coimbatore_location()
    fuel = get_normal_fuel()

    print(f"🚗 Starting simulation for {vehicle_id}")

    while True:
        # Slightly move vehicle from last position (realistic movement)
        lat += random.uniform(-0.001, 0.001)
        lon += random.uniform(-0.001, 0.001)

        # Keep within Coimbatore bounds
        lat = max(COIMBATORE_BOUNDS["lat_min"], min(COIMBATORE_BOUNDS["lat_max"], lat))
        lon = max(COIMBATORE_BOUNDS["lon_min"], min(COIMBATORE_BOUNDS["lon_max"], lon))

        # Normal readings
        speed = get_normal_speed()
        fuel = max(0, fuel - random.uniform(0.1, 0.5))  # Fuel slowly decreases

        # Inject chaos if enabled
        if CHAOS_MODE:
            speed, fuel = inject_chaos(speed, fuel)

        # Build GPS payload
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

        # Publish to MQTT topic
        topic = f"{MQTT_TOPIC}/{vehicle_id}"
        if client:
            client.publish(topic, json.dumps(payload))

        print(
            f"📍 {vehicle_id} | "
            f"lat={payload['latitude']} "
            f"lon={payload['longitude']} | "
            f"speed={speed} km/h | "
            f"fuel={fuel:.1f}%"
        )

        time.sleep(2)  # Send data every 2 seconds


# ─── MQTT Setup ───────────────────────────────────────────────────────────────
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ Connected to MQTT broker!")
    else:
        print(f"❌ Connection failed with code {rc}")


def on_publish(client, userdata, mid, reason_code=None, properties=None):
    pass  # Silent on every publish


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("🚀 FleetPulse GPS Simulator Starting...")
    print(f"📡 Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
    print(f"💥 Chaos Mode: {'ON' if CHAOS_MODE else 'OFF'}")
    print(f"🚗 Simulating {len(VEHICLES)} vehicles in Coimbatore\n")

    # Setup MQTT client
    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2, client_id="fleetpulse-simulator"
    )
    client.on_connect = on_connect
    client.on_publish = on_publish

    # Connect to broker
    # Connect to broker
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        print("✅ Connected to MQTT broker!")
    except Exception as e:
        print(f"⚠️ MQTT broker not available: {e}")
        print("💡 Running in PRINT-ONLY mode for testing...")
        client = None

    # Start one thread per vehicle
    threads = []
    for vehicle in VEHICLES:
        t = threading.Thread(
            target=simulate_vehicle, args=(vehicle, client), daemon=True
        )
        threads.append(t)
        t.start()
        time.sleep(0.1)  # Small delay between thread starts

    print(f"\n✅ All {len(VEHICLES)} vehicle threads started!\n")

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Simulator stopped by user")
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
