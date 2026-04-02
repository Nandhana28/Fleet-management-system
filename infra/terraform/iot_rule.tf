# IoT Core Rule — forwards all GPS messages to SQS queue
resource "aws_iot_topic_rule" "gps_to_sqs" {
  name        = "FleetPulseGPSToSQS"
  description = "Forward GPS data from vehicles to SQS queue"
  enabled     = true
  sql         = "SELECT * FROM 'fleetpulse/gps/+'"
  sql_version = "2016-03-23"

  # Forward to SQS
  sqs {
    role_arn   = aws_iam_role.iot_role.arn
    queue_url  = aws_sqs_queue.gps_queue.url
    use_base64 = false
  }

  # If SQS fails — log to CloudWatch
  error_action {
    cloudwatch_logs {
      log_group_name = "/aws/iot/fleetpulse-errors"
      role_arn       = aws_iam_role.iot_role.arn
    }
  }

  tags = { Project = "FleetPulse" }
}

# IAM Role for IoT Core to write to SQS
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

# Policy — allows IoT to write to SQS and CloudWatch
resource "aws_iam_role_policy" "iot_policy" {
  name = "fleetpulse-iot-policy"
  role = aws_iam_role.iot_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.gps_queue.arn
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
