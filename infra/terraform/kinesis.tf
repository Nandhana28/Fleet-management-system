resource "aws_kinesis_stream" "gps_stream" {
  name             = "fleetpulse-gps-stream"
  shard_count      = 1
  retention_period = 24

  tags = {
    Name    = "FleetPulse GPS Stream"
    Project = "FleetPulse"
  }
}
