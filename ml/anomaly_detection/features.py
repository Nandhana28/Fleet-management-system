import pandas as pd
import numpy as np


def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Feature engineering for anomaly detection
    Adds speed delta, fuel rate, heading change
    """
    df = df.copy()

    # Speed delta — change in speed between readings
    df["speed_delta"] = df.groupby("vehicle_id")["speed"].diff().fillna(0)

    # Fuel rate — fuel consumption rate
    df["fuel_rate"] = df.groupby("vehicle_id")["fuel_level"].diff().fillna(0)

    # Distance from Coimbatore center
    CBE_LAT, CBE_LON = 11.0168, 76.9558
    df["distance_from_center"] = (
        np.sqrt((df["latitude"] - CBE_LAT) ** 2 + (df["longitude"] - CBE_LON) ** 2)
        * 111
    )  # Convert to km

    return df
