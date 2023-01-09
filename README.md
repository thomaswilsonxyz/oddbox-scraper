# Upcoming Oddbox Deliveries Scraper

Get the upcoming contents of your Oddbox.  A small personal project for learning, and because I _just want to know what's in the damned box_.

## AWS Set Up

- This project uses AWS SES (simple e-mail service) to alert you of upcoming deliveries.  To do this you must have at least one verified domain in SES.  There are [many way to do this](https://docs.aws.amazon.com/ses/latest/dg/email-authentication-methods.html).

## Set Up Terraform 

- You **must** create a `.tfvars` file (e.g. `main.tfvars`) locally and specify the following values:
    - `email_address_from` : the sender of the notifying e-mail (e.g. `Oddbox Scraper Notification <example@gmail>`) 
    - `email_address_to` : the e-mail that will receive the notification of the upcoming Oddbox delivery contents

## Local Set Up

- Make sure you have `yarn` installed
- Download the dependencies (`yarn`) and build the functions (`yarn build`)