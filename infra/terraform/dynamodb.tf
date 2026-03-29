# Vehicles Table
resource "aws_dynamodb_table" "vehicles" {
  name         = "Vehicles"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "vehicle_id"

  attribute {
    name = "vehicle_id"
    type = "S"
  }

  tags = { Project = "FleetPulse" }
}

# Trips Table
resource "aws_dynamodb_table" "trips" {
  name         = "Trips"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "trip_id"
  range_key    = "timestamp"

  attribute {
    name = "trip_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = { Project = "FleetPulse" }
}

# Alerts Table
resource "aws_dynamodb_table" "alerts" {
  name         = "Alerts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "alert_id"

  attribute {
    name = "alert_id"
    type = "S"
  }

  tags = { Project = "FleetPulse" }
}

# Drivers Table
resource "aws_dynamodb_table" "drivers" {
  name         = "Drivers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "driver_id"

  attribute {
    name = "driver_id"
    type = "S"
  }

  tags = { Project = "FleetPulse" }
}

# AgentConfig Table
resource "aws_dynamodb_table" "agent_config" {
  name         = "AgentConfig"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "config_key"

  attribute {
    name = "config_key"
    type = "S"
  }

  tags = { Project = "FleetPulse" }
}
