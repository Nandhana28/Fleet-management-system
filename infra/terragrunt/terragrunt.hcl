# Terragrunt config — manages dev and prod environments separately

remote_state {
  backend = "s3"
  config = {
    bucket         = "fleetpulse-terraform-state-farhana"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "fleetpulse-terraform-lock"
  }
}

inputs = {
  project     = "FleetPulse"
  region      = "ap-south-1"
  environment = "dev"
}
