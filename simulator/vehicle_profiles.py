# Tamil Nadu vehicle profiles for FleetPulse simulation
VEHICLE_PROFILES = [
    {
        "vehicle_id": f"vehicle-{i}",
        "reg_number": f"TN 33 AB {1000 + i}",
        "vehicle_type": "lorry" if i <= 5 else "van",
        "fuel_capacity": 200 if i <= 5 else 60,
        "driver_id": f"driver-{i}",
    }
    for i in range(1, 11)
]
