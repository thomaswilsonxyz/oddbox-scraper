data "aws_iam_policy_document" "iam_policy_document_for_oddbox_scraper" {
  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "iam_policy_assume_lambda_service" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "iam_policy_document_for_lambdas" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueUrl"
    ]
    resources = [
      aws_sqs_queue.oddbox_scraper_queue.arn
    ]

  }

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:Scan",
    ]
    resources = [
      aws_dynamodb_table.oddbox_scraper_results_table.arn,
      "${aws_dynamodb_table.oddbox_scraper_results_table.arn}/index/*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]
    resources = [
      "*"
    ]
  }
}

data "aws_iam_policy_document" "oddbox_scraper_queue_policy" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:GetQueueUrl"
    ]
    resources = [
      aws_sqs_queue.oddbox_scraper_queue.arn
    ]
  }
}

data "archive_file" "scrape_oddbox_upcoming_page_lambda_function_payload" {
  type        = "zip"
  source_file = "${path.module}/dist/scrape.js"
  output_path = "${path.module}/dist/scrape.zip"
}

data "archive_file" "process_oddbox_scraper_queue_lambda_function_payload" {
  type        = "zip"
  source_file = "${path.module}/dist/handleQueueMessage.js"
  output_path = "${path.module}/dist/handleQueueMessage.zip"
}