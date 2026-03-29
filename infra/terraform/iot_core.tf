# IoT Core Thing Type
resource "aws_iot_thing_type" "vehicle" {
  name = "FleetPulseVehicle"

  properties {
    description = "Vehicle GPS tracking device for FleetPulse"
  }
}

# IoT Core Thing (represents each vehicle)
resource "aws_iot_thing" "fleet_vehicles" {
  count      = 10
  name       = "vehicle-${count.index + 1}"
  thing_type_name = aws_iot_thing_type.vehicle.name
}

# IoT Policy — allows vehicles to connect and publish GPS data
resource "aws_iot_policy" "vehicle_policy" {
  name = "FleetPulseVehiclePolicy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "iot:Connect",
          "iot:Publish",
          "iot:Subscribe",
          "iot:Receive"
        ]
        Resource = "*"
      }
    ]
  })
}
