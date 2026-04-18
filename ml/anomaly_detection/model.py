# import json
import pickle
import numpy as np
import pandas as pd
import boto3
from sklearn.ensemble import IsolationForest
from datetime import datetime

# S3 bucket to save trained model
S3_BUCKET = "fleetpulse-terraform-state-farhana"
MODEL_KEY = "models/anomaly_detection_model.pkl"

# ─── Step 1: Generate 10,000 Synthetic Training Records ──────────────────────


def generate_training_data(n_samples=10000):
    """
    Generate synthetic normal vehicle behavior data for training
    These represent healthy, normal driving patterns in Coimbatore
    """
    np.random.seed(42)

    print(f"🔄 Generating {n_samples} synthetic training records...")

    data = {
        # Normal speed: 20-60 km/h in city
        "speed": np.random.uniform(20, 60, n_samples),
        # Normal fuel: gradually decreasing from 30-100%
        "fuel_level": np.random.uniform(30, 100, n_samples),
        # Normal fuel drop per reading: 0-2%
        "fuel_drop": np.random.uniform(0, 2, n_samples),
        # Normal latitude in Coimbatore
        "latitude": np.random.uniform(10.98, 11.08, n_samples),
        # Normal longitude in Coimbatore
        "longitude": np.random.uniform(76.92, 77.02, n_samples),
        # Normal route deviation: 0-1 km
        "route_deviation_km": np.random.uniform(0, 1, n_samples),
    }

    df = pd.DataFrame(data)
    print(f"✅ Generated {len(df)} training records")
    print(f"📊 Sample data:\n{df.head()}")
    return df


# ─── Step 2: Train Isolation Forest Model ────────────────────────────────────


def train_model(df):
    """
    Train Isolation Forest model on normal vehicle behavior
    Isolation Forest works by isolating anomalies —
    anomalies are easier to isolate than normal points
    """
    print("\n🤖 Training Isolation Forest model...")

    # Features used for anomaly detection
    features = [
        "speed",
        "fuel_level",
        "fuel_drop",
        "latitude",
        "longitude",
        "route_deviation_km",
    ]

    X = df[features].values

    # Train Isolation Forest
    # contamination=0.05 means we expect 5% of data to be anomalous
    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
        verbose=0,
    )

    model.fit(X)
    print("✅ Model trained successfully!")

    # Test model on training data
    predictions = model.predict(X)
    anomaly_count = sum(1 for p in predictions if p == -1)
    print(f"📊 Anomalies detected in training data: {anomaly_count}/{len(X)}")

    return model, features


# ─── Step 3: Save Model to S3 ────────────────────────────────────────────────


def save_model_to_s3(model, features):
    """Save trained model as pickle file to S3"""
    print(f"\n💾 Saving model to S3: s3://{S3_BUCKET}/{MODEL_KEY}")

    # Save model and feature names together
    model_artifact = {
        "model": model,
        "features": features,
        "trained_at": datetime.utcnow().isoformat(),
        "model_type": "IsolationForest",
    }

    # Serialize to bytes
    model_bytes = pickle.dumps(model_artifact)

    # Upload to S3
    s3_client = boto3.client("s3", region_name="ap-south-1")
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=MODEL_KEY,
        Body=model_bytes,
        ContentType="application/octet-stream",
    )

    print("✅ Model saved to S3 successfully!")
    return MODEL_KEY


def save_model_locally(model, features):
    """Save model locally for testing"""
    model_artifact = {
        "model": model,
        "features": features,
        "trained_at": datetime.utcnow().isoformat(),
        "model_type": "IsolationForest",
    }

    with open("ml/anomaly_detection/model.pkl", "wb") as f:
        pickle.dump(model_artifact, f)

    print("✅ Model saved locally: ml/anomaly_detection/model.pkl")


# ─── Step 4: Predict Anomalies ───────────────────────────────────────────────


def predict_anomaly(model, features, payload):
    """
    Check if a GPS payload is anomalous
    Returns True if anomaly detected, False if normal
    """
    # Extract features from payload
    feature_vector = np.array(
        [
            [
                float(payload.get("speed", 0)),
                float(payload.get("fuel_level", 100)),
                float(payload.get("fuel_drop", 0)),
                float(payload.get("latitude", 11.03)),
                float(payload.get("longitude", 76.96)),
                float(payload.get("route_deviation_km", 0)),
            ]
        ]
    )

    # Predict — returns 1 (normal) or -1 (anomaly)
    prediction = model.predict(feature_vector)
    score = model.decision_function(feature_vector)

    is_anomaly = prediction[0] == -1

    if is_anomaly:
        print(
            f"🚨 Anomaly detected! Score: {score[0]:.3f} "
            f"for vehicle {payload.get('vehicle_id')}"
        )
    return is_anomaly, score[0]


# ─── Step 5: Detect Specific Anomaly Types ───────────────────────────────────


def detect_anomaly_type(payload, previous_fuel=None):
    """
    Detect specific type of anomaly:
    1. Overspeeding — speed > 80 km/h
    2. Fuel theft — sudden fuel drop > 15%
    3. Route deviation — > 2km from expected path
    """
    anomalies = []

    # Check overspeeding
    if float(payload.get("speed", 0)) > 80:
        anomalies.append(
            {
                "type": "OVERSPEEDING",
                "severity": "HIGH",
                "details": f"Speed {payload['speed']} km/h exceeds 80 km/h limit",
            }
        )

    # Check fuel theft
    if previous_fuel is not None:
        fuel_drop = previous_fuel - float(payload.get("fuel_level", 100))
        if fuel_drop > 15:
            anomalies.append(
                {
                    "type": "FUEL_THEFT",
                    "severity": "CRITICAL",
                    "details": (
                        f"Fuel dropped {fuel_drop:.1f}% suddenly "
                        f"(from {previous_fuel}% to {payload['fuel_level']}%)"
                    ),
                }
            )

    # Check route deviation (simplified — checks if outside Coimbatore)
    lat = float(payload.get("latitude", 11.03))
    lon = float(payload.get("longitude", 76.96))
    if lat < 10.95 or lat > 11.15 or lon < 76.85 or lon > 77.10:
        anomalies.append(
            {
                "type": "ROUTE_DEVIATION",
                "severity": "MEDIUM",
                "details": (f"Vehicle outside expected area: " f"lat={lat}, lon={lon}"),
            }
        )

    return anomalies


# ─── Main — Train and Save Model ─────────────────────────────────────────────

if __name__ == "__main__":
    print("🚀 FleetPulse ML Anomaly Detection — Model Training")
    print("=" * 50)

    # Step 1: Generate training data
    df = generate_training_data(n_samples=10000)

    # Step 2: Train model
    model, features = train_model(df)

    # Step 3: Save locally first
    save_model_locally(model, features)

    # Step 4: Test with sample anomalous data
    print("\n🧪 Testing model with anomalous data...")

    test_cases = [
        {
            "vehicle_id": "vehicle-1",
            "speed": 110,  # Overspeeding!
            "fuel_level": 85,
            "fuel_drop": 0.5,
            "latitude": 11.023,
            "longitude": 76.987,
            "route_deviation_km": 0.3,
        },
        {
            "vehicle_id": "vehicle-2",
            "speed": 35,
            "fuel_level": 50,
            "fuel_drop": 25,  # Fuel theft!
            "latitude": 11.045,
            "longitude": 76.955,
            "route_deviation_km": 0.1,
        },
        {
            "vehicle_id": "vehicle-3",
            "speed": 40,
            "fuel_level": 70,
            "fuel_drop": 0.3,
            "latitude": 11.03,
            "longitude": 76.96,
            "route_deviation_km": 5,  # Route deviation!
        },
    ]

    for test in test_cases:
        is_anomaly, score = predict_anomaly(model, features, test)
        anomaly_types = detect_anomaly_type(
            test, previous_fuel=test["fuel_level"] + test["fuel_drop"]
        )
        print(f"Vehicle: {test['vehicle_id']}")
        print(f"  Anomaly: {is_anomaly} | Score: {score:.3f}")
        print(f"  Types: {[a['type'] for a in anomaly_types]}\n")

    print("✅ Model training and testing complete!")
