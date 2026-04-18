import random


def inject_chaos(speed: float, fuel: float) -> tuple:
    """Inject random anomalies for ML testing"""
    anomaly = random.choice(
        [
            "normal",
            "normal",
            "normal",
            "overspeed",
            "fuel_theft",
        ]
    )

    if anomaly == "overspeed":
        speed = round(random.uniform(85, 120), 2)
        print(f"🚨 Overspeeding: {speed} km/h")

    elif anomaly == "fuel_theft":
        fuel = round(fuel - random.uniform(15, 30), 2)
        fuel = max(0, fuel)
        print(f"🚨 Fuel theft: dropped to {fuel}%")

    return speed, fuel
