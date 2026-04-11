# EventBridge rule — triggers S3 archiver every 5 minutes
resource "aws_cloudwatch_event_rule" "s3_archiver" {
  name                = "fleetpulse-s3-archiver"
  description         = "Archive GPS data to S3 every 5 minutes"
  schedule_expression = "rate(5 minutes)"

  tags = { Project = "FleetPulse" }
}

# Connect EventBridge rule to S3 archiver Lambda
resource "aws_cloudwatch_event_target" "s3_archiver" {
  rule      = aws_cloudwatch_event_rule.s3_archiver.name
  target_id = "S3ArchiverLambda"
  arn       = aws_lambda_function.s3_archiver.arn
}

# Allow EventBridge to invoke Lambda
resource "aws_lambda_permission" "s3_archiver" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.s3_archiver.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_archiver.arn
}
