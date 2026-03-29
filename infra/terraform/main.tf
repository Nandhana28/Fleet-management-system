# S3 Bucket for Terraform Remote State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "fleetpulse-terraform-state-farhana"

  tags = {
    Name        = "FleetPulse Terraform State"
    Environment = "dev"
    Project     = "FleetPulse"
  }
}

# Enable versioning so you can see history of state files
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "fleetpulse-terraform-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name    = "FleetPulse Terraform Lock"
    Project = "FleetPulse"
  }
}
