"""
FleetPulse ML Trainer
Run this script to retrain the model on new data:
  python ml/anomaly_detection/trainer.py
"""
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from datetime import datetime


FEATURES = ['speed', 'fuel_level', 'fuel_drop', 'latitude', 'longitude', 'route_deviation_km']
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')


def generate_training_data(n_normal=10000, n_anomaly=500):
    np.random.seed(42)

    normal = pd.DataFrame({
        'speed': np.random.uniform(20, 60, n_normal),
        'fuel_level': np.random.uniform(30, 100, n_normal),
        'fuel_drop': np.random.uniform(0, 2, n_normal),
        'latitude': np.random.uniform(10.98, 11.08, n_normal),
        'longitude': np.random.uniform(76.92, 77.02, n_normal),
        'route_deviation_km': np.random.uniform(0, 1, n_normal),
    })

    anomalous = pd.DataFrame({
        'speed': np.concatenate([
            np.random.uniform(85, 130, n_anomaly // 2),
            np.random.uniform(20, 60, n_anomaly // 2),
        ]),
        'fuel_level': np.random.uniform(10, 100, n_anomaly),
        'fuel_drop': np.concatenate([
            np.random.uniform(0, 2, n_anomaly // 2),
            np.random.uniform(15, 40, n_anomaly // 2),
        ]),
        'latitude': np.random.uniform(10.98, 11.08, n_anomaly),
        'longitude': np.random.uniform(76.92, 77.02, n_anomaly),
        'route_deviation_km': np.concatenate([
            np.random.uniform(0, 1, int(n_anomaly * 0.8)),
            np.random.uniform(3, 10, int(n_anomaly * 0.2)),
        ]),
    })

    return pd.concat([normal, anomalous], ignore_index=True)


def train(n_normal=10000, n_anomaly=500):
    print(f"Generating {n_normal} normal + {n_anomaly} anomalous samples...")
    df = generate_training_data(n_normal, n_anomaly)

    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
    )
    model.fit(df[FEATURES].values)

    preds = model.predict(df[FEATURES].values)
    print(f"Anomalies detected in training: {sum(p==-1 for p in preds)}/{len(preds)}")

    artifact = {
        'model': model,
        'features': FEATURES,
        'trained_at': datetime.utcnow().isoformat(),
        'model_type': 'IsolationForest',
        'thresholds': {
            'speed_limit': 80,
            'fuel_drop_threshold': 15,
            'route_deviation_km': 2,
        }
    }

    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(artifact, f)

    print(f"Model saved: {MODEL_PATH}")
    return model, FEATURES


if __name__ == "__main__":
    train()