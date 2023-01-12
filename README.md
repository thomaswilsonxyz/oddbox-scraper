# Upcoming Oddbox Deliveries Scraper

Get the upcoming contents of your Oddbox.  A small personal project for learning, and because I _just want to know what's in the damned box_.

[Intro blog post](https://thomaswilson.xyz/blog/2023-01-12-2023-01-12-little-project-oddbox-scraper)

## AWS Set Up

This project runs on Amazon Web Services (AWS).  You can [create an account here](https://aws.amazon.com/resources/create-account/).  Though this project assumes _some_ familiarity with AWS.

- You need a User in an AWS account with sufficient permissions to create and modify AWS resources (see both `main.tf` and `main.data.tf` for a list).  Create an access and secret key for this User and store the details in your local AWS Config Files ([official config file docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)).  This profile is referenced by the `aws_profile` variable.
- This project uses AWS SES (simple e-mail service) to alert you of upcoming deliveries.  To do this you must have at least one verified domain in SES.  There are [many way to do this](https://docs.aws.amazon.com/ses/latest/dg/email-authentication-methods.html).  

## Set Up Terraform 

- You **must** create a `.tfvars` file (e.g. `main.tfvars`) locally and specify the following values:
    - `email_address_from` : the sender of the notifying e-mail (e.g. `Oddbox Scraper Notification <example@gmail>`) 
    - `email_address_to` : the e-mail that will receive the notification of the upcoming Oddbox delivery contents
    - `email_address_reply_to` : if you decide to reply to the e-mail, where is it going
    - `aws_profile` : The name of the AWS profile set up in your local config which will deploy the resources.
    - `aws_region` : self explanatory, e.g. `eu-west-1`


## Local Set Up

- Make sure you have node and NPM installed, then install yarn (`npm i -g yarn`)/
- Download the dependencies (`yarn`) and build the functions (`yarn build`)
- Create your Terraform varaibles file in the root directory (e.g. `main.tfvars`)
- `terrafom plan -var-file="main.tfvars` to view the changes Terraform will make and deploy
- `terraform apply -var-file="main.tfvars` to actually deploy those to your cloud environment