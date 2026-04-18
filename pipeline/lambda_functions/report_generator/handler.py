import json
import boto3
from datetime import datetime

dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
trips_table = dynamodb.Table("Trips")
s3_client = boto3.client("s3", region_name="ap-south-1")
S3_BUCKET = "fleetpulse-terraform-state-farhana"


def handler(event, context):
    """
    Report Generator Lambda
    Scheduled daily — generates fleet report → saves to S3
    """
    print("📊 Generating daily fleet report...")
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # Get all trips
    response = trips_table.scan(Limit=500)
    trips = response.get("Items", [])

    # Build report
    report = {
        "date": today,
        "total_trips": len(trips),
        "vehicles_active": len(set(t["vehicle_id"] for t in trips)),
        "generated_at": datetime.utcnow().isoformat(),
    }

    # Save to S3
    s3_key = f"reports/{today}/daily_report.json"
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=json.dumps(report),
        ContentType="application/json",
    )

    print(f"✅ Report saved: s3://{S3_BUCKET}/{s3_key}")
    return {"statusCode": 200, "body": json.dumps(report)}
