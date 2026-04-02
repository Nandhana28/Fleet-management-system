# SQS Queue — replaces Kinesis (free tier eligible!)
resource "aws_sqs_queue" "gps_queue" {
  name                       = "fleetpulse-gps-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 86400  # 24 hours
  receive_wait_time_seconds  = 10

  tags = {
    Name    = "FleetPulse GPS Queue"
    Project = "FleetPulse"
  }
}

# Output the queue URL for use in other services
output "sqs_queue_url" {
  value = aws_sqs_queue.gps_queue.url
}
