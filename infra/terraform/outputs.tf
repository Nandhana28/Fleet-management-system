output "sqs_queue_url" {
  value = aws_sqs_queue.gps_queue.url
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}
