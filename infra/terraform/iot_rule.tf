# IoT Core Rule — forwards all GPS messages to Kinesis Data Stream
resource "aws_iot_topic_rule" "gps_to_kinesis" {
  name        = "FleetPulseGPSToKinesis"
  description = "Forward GPS data from vehicles to Kinesis stream"
  enabled     = true
  sql         = "SELECT * FROM 'fleetpulse/gps/+'"
  sql_version = "2016-03-23"

  # Forward to Kinesis
  kinesis {
    role_arn      = aws_iam_role.iot_role.arn
    stream_name   = "fleetpulse-gps-stream"
    partition_key = "$${clientId()}"
  }

  # If Kinesis fails — log to CloudWatch
  error_action {
    cloudwatch_logs {
      log_group_name = "/aws/iot/fleetpulse-errors"
      role_arn       = aws_iam_role.iot_role.arn
    }
  }

  tags = { Project = "FleetPulse" }
}

# IAM Role for IoT Core to write to Kinesis
resource "aws_iam_role" "iot_role" {
  name = "fleetpulse-iot-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "iot.amazonaws.com"
        }
      }
    ]
  })

  tags = { Project = "FleetPulse" }
}

# Policy — allows IoT to write to Kinesis and CloudWatch
resource "aws_iam_role_policy" "iot_policy" {
  name = "fleetpulse-iot-policy"
  role = aws_iam_role.iot_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:PutRecord",
          "kinesis:PutRecords"
        ]
        Resource = "arn:aws:kinesis:ap-south-1:*:stream/fleetpulse-gps-stream"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}
