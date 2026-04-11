# Kinesis requires paid AWS plan - using SQS instead (free tier)
# resource "aws_kinesis_stream" "gps_stream" {
#   name             = "fleetpulse-gps-stream"
#   shard_count      = 1
#   retention_period = 24
# }
