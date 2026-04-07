import pickle
import numpy as np
import boto3

s3_client = boto3.client("s3", region_name="ap-south-1")
S3_BUCKET = "fleetpulse-terraform-state-farhana"
MODEL_KEY = "models/anomaly_detection_model.pkl"
_model_cache = None


def load_model():
    """Load model from S3 with caching"""
    global _model_cache
    if _model_cache:
        return _model_cache
    response = s3_client.get_object(Bucket=S3_BUCKET, Key=MODEL_KEY)
    _model_cache = pickle.loads(response["Body"].read())
    return _model_cache


def predict(payload: dict) -> tuple:
    """Run anomaly prediction on GPS payload"""
    artifact = load_model()
    model = artifact["model"]
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
    prediction = model.predict(feature_vector)
    score = model.decision_function(feature_vector)
    return prediction[0] == -1, float(score[0])
