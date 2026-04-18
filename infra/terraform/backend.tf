terraform {
  backend "s3" {
    bucket         = "fleetpulse-terraform-state-farhana"
    key            = "terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "fleetpulse-terraform-lock"
    encrypt        = true
  }
}
