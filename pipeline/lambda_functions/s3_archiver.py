import json
import boto3
import os
from datetime import datetime

# AWS clients
s3_client = boto3.client("s3", region_name="ap-south-1")
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
trips_table = dynamodb.Table("Trips")

# S3 bucket name
S3_BUCKET = os.environ.get("S3_BUCKET", "fleetpulse-terraform-state-farhana")
S3_PREFIX = "gps-archive"


def get_recent_trips():
    """
    Fetch last 5 minutes of trip records from DynamoDB
    These will be archived to S3
    """
    response = trips_table.scan(Limit=100)
    return response.get("Items", [])


def archive_to_s3(trips):
    """
    Save trip records to S3 as JSON file
    File path: gps-archive/2026/03/29/14-30.json
    """
    now = datetime.utcnow()

    # Create organized folder structure by date/time
    s3_key = (
        f"{S3_PREFIX}/"
        f"{now.year}/{now.month:02d}/{now.day:02d}/"
        f"{now.hour:02d}-{now.minute:02d}.json"
    )

    # Convert to JSON
    archive_data = {
        "archived_at": now.isoformat(),
        "record_count": len(trips),
        "trips": trips,
    }

    # Upload to S3
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=json.dumps(archive_data, default=str),
        ContentType="application/json",
    )

    print(f"✅ Archived {len(trips)} records to s3://{S3_BUCKET}/{s3_key}")
    return s3_key


def handler(event, context):
    """
    S3 Archiver Lambda
    Runs every 5 minutes via EventBridge scheduled rule
    Fetches recent GPS data from DynamoDB and archives to S3
    """
    print("🗄️ Starting S3 archival job...")
    print(f"⏰ Triggered at: {datetime.utcnow().isoformat()}")

    try:
        # Get recent trip records
        trips = get_recent_trips()
        print(f"📦 Found {len(trips)} records to archive")

        if len(trips) == 0:
            print("ℹ️ No records to archive")
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "No records to archive"}),
            }

        # Archive to S3
        s3_key = archive_to_s3(trips)

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Archive complete",
                    "s3_key": s3_key,
                    "records_archived": len(trips),
                }
            ),
        }

    except Exception as e:
        print(f"❌ Archive failed: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
