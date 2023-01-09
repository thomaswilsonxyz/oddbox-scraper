variable "name_prefix" {
  type        = string
  description = "The name prefix to use for all resources (for human readability)"
  default     = "oddbox-scraper"
}

variable "aws_region" {
  type        = string
  description = "The AWS region to deploy to"
  default     = "eu-west-2"
}

variable "aws_profile" {
  type        = string
  description = "The AWS profile to use for deployment"
  default     = "default"
}

variable "email_address_from" {
  type        = string
  description = "The e-mail address that AWS SES will send emails from, e.g. 'Oddbox Notifier <noreply@mydomain.com>'"
  sensitive   = true
}

variable "email_address_to" {
  type        = string
  description = "The e-mail address that will receive notifications of upcoming Oddbox Deliveries, e.g. 'me@mydomain.com'"
  sensitive   = true
}

variable "email_address_reply_to" {
  type        = string
  description = "The e-mail address that will be used as the 'reply-to' address for e-mails sent by AWS SES, e.g. 'me@mydomain.com'"
  sensitive   = true
}