### 
# Config
###
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.48.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

###
# IAM
###
resource "aws_iam_role" "iam_role_for_oddbox_scraper_lambda" {
  assume_role_policy = data.aws_iam_policy_document.iam_policy_assume_lambda_service.json
  description        = "IAM role for all Lambda Functions used in the Oddbox Scraper.  Neither function uses all of the permissions, but it's easier to just give them all the permissions they need."
  inline_policy {
    name   = "oddbox_scraper_lambda_inline_policy"
    policy = data.aws_iam_policy_document.iam_policy_document_for_lambdas.json
  }
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaDynamoDBExecutionRole"
  ]
}

###
# LAMBDA
###
resource "aws_lambda_function" "scrape_oddbox_upcoming_page_lambda" {
  function_name    = "${var.name_prefix}_scrape_oddbox_upcoming_page_lambda"
  description      = "Finds a list of upcoming Oddbox deliveries, and gets a list of fruits and vegetables.  Add this data to an SQS queue."
  filename         = data.archive_file.scrape_oddbox_upcoming_page_lambda_function_payload.output_path
  role             = aws_iam_role.iam_role_for_oddbox_scraper_lambda.arn
  handler          = "scrape.handler"
  source_code_hash = filebase64sha256(data.archive_file.scrape_oddbox_upcoming_page_lambda_function_payload.output_path)
  runtime          = "nodejs16.x"
  timeout          = 30
  environment {
    variables = {
      SQS_QUEUE_URL = aws_sqs_queue.oddbox_scraper_queue.url
    }
  }
}

resource "aws_lambda_function" "process_oddbox_scraper_queue_lambda" {
  function_name    = "${var.name_prefix}_process_oddbox_scraper_queue_lambda"
  description      = "Processes information about upcoming Oddbox deliveries (in the `scrape_oddbox_upcoming_page_lambda`) and processes the information: stores in DynamoDB, and notifies you via e-mail"
  filename         = data.archive_file.process_oddbox_scraper_queue_lambda_function_payload.output_path
  role             = aws_iam_role.iam_role_for_oddbox_scraper_lambda.arn
  handler          = "handleQueueMessage.handler"
  source_code_hash = filebase64sha256(data.archive_file.process_oddbox_scraper_queue_lambda_function_payload.output_path)
  runtime          = "nodejs16.x"
  timeout          = 30

  environment {
    variables = {
      DYNAMODB_TABLE_NAME    = aws_dynamodb_table.oddbox_scraper_results_table.name
      SQS_QUEUE_URL          = aws_sqs_queue.oddbox_scraper_queue.url
      EMAIL_ADDRESS_FROM     = var.email_address_from
      EMAIL_ADDRESS_TO       = var.email_address_to
      EMAIL_ADDRESS_REPLY_TO = var.email_address_reply_to
    }
  }
}

###
# Schedule for Events
###
resource "aws_cloudwatch_event_rule" "every_one_day" {
  name                = "${var.name_prefix}_every_one_day"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "scrape_oddbox_upcoming_page_lambda" {
  rule      = aws_cloudwatch_event_rule.every_one_day.name
  target_id = "scrape_oddbox_upcoming_page_lambda"
  arn       = aws_lambda_function.scrape_oddbox_upcoming_page_lambda.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_scrape_oddbox_upcoming_page_lambda" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scrape_oddbox_upcoming_page_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every_one_day.arn
}

###
# SQS Queue
###
resource "aws_sqs_queue" "oddbox_scraper_queue" {
  name = "${var.name_prefix}_oddbox_scraper_queue"
}

resource "aws_sqs_queue_policy" "oddbox_scraper_queue_policy" {
  queue_url = aws_sqs_queue.oddbox_scraper_queue.id
  policy    = data.aws_iam_policy_document.oddbox_scraper_queue_policy.json
}

resource "aws_lambda_event_source_mapping" "oddbox_scraper_queue_lambda_trigger" {
  event_source_arn = aws_sqs_queue.oddbox_scraper_queue.arn
  function_name    = aws_lambda_function.process_oddbox_scraper_queue_lambda.function_name
  batch_size       = 1
  enabled          = true
}

###
# DynamoDB
###
resource "aws_dynamodb_table" "oddbox_scraper_results_table" {
  name           = "OddboxUpcomingDeliveries"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"
  range_key      = "created_at"



  local_secondary_index {
    name            = "title-index"
    range_key       = "title"
    projection_type = "ALL"
  }

  local_secondary_index {
    name            = "vegetables-index"
    range_key       = "vegetables"
    projection_type = "ALL"
  }

  local_secondary_index {
    name            = "fruits-index"
    range_key       = "fruits"
    projection_type = "ALL"
  }

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "title"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  attribute {
    name = "vegetables"
    type = "S"
  }

  attribute {
    name = "fruits"
    type = "S"
  }
}