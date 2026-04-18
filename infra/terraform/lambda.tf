# Lambda function zip placeholders
data "archive_file" "kinesis_consumer" {
  type        = "zip"
  output_path = "${path.module}/lambda_zips/kinesis_consumer.zip"

  source {
    content  = "def handler(event, context): pass"
    filename = "kinesis_consumer.py"
  }
}

data "archive_file" "anomaly_detector" {
  type        = "zip"
  output_path = "${path.module}/lambda_zips/anomaly_detector.zip"

  source {
    content  = "def handler(event, context): pass"
    filename = "anomaly_detector.py"
  }
}

data "archive_file" "alert_sender" {
  type        = "zip"
  output_path = "${path.module}/lambda_zips/alert_sender.zip"

  source {
    content  = "def handler(event, context): pass"
    filename = "alert_sender.py"
  }
}

# Kinesis Consumer Lambda
resource "aws_lambda_function" "kinesis_consumer" {
  filename         = data.archive_file.kinesis_consumer.output_path
  function_name    = "fleetpulse-kinesis-consumer"
  role             = aws_iam_role.lambda_role.arn
  handler          = "kinesis_consumer.handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.kinesis_consumer.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = "Trips"
      REGION         = "ap-south-1"
    }
  }

  tags = { Project = "FleetPulse" }
}

# Anomaly Detector Lambda
resource "aws_lambda_function" "anomaly_detector" {
  filename         = data.archive_file.anomaly_detector.output_path
  function_name    = "fleetpulse-anomaly-detector"
  role             = aws_iam_role.lambda_role.arn
  handler          = "anomaly_detector.handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.anomaly_detector.output_base64sha256

  environment {
    variables = {
      ALERTS_TABLE = "Alerts"
      REGION       = "ap-south-1"
    }
  }

  tags = { Project = "FleetPulse" }
}

# Alert Sender Lambda
resource "aws_lambda_function" "alert_sender" {
  filename         = data.archive_file.alert_sender.output_path
  function_name    = "fleetpulse-alert-sender"
  role             = aws_iam_role.lambda_role.arn
  handler          = "alert_sender.handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.alert_sender.output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN = "placeholder"
      REGION        = "ap-south-1"
    }
  }

  tags = { Project = "FleetPulse" }
}


# S3 Archiver Lambda
data "archive_file" "s3_archiver" {
  type        = "zip"
  output_path = "${path.module}/lambda_zips/s3_archiver.zip"

  source {
    content  = "def handler(event, context): pass"
    filename = "s3_archiver.py"
  }
}

resource "aws_lambda_function" "s3_archiver" {
  filename         = data.archive_file.s3_archiver.output_path
  function_name    = "fleetpulse-s3-archiver"
  role             = aws_iam_role.lambda_role.arn
  handler          = "s3_archiver.handler"
  runtime          = "python3.11"
  source_code_hash = data.archive_file.s3_archiver.output_base64sha256

  environment {
    variables = {
      S3_BUCKET = "fleetpulse-terraform-state-farhana"
      REGION    = "ap-south-1"
    }
  }

  tags = { Project = "FleetPulse" }
}
