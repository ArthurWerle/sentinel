#!/bin/bash

STACK_NAME="WebCrawlerApp"
TEMPLATE_FILE="crawler.yml"
S3_BUCKET="web-crawler-app-code"
PYTHON_FILE="app.py"
EMAIL_ADDRESS="your-email@example.com"

echo "Zipping the Python file..."
zip $PYTHON_FILE.zip $PYTHON_FILE
echo "Zip file created."

echo "Uploading the zip file to S3..."
aws s3 cp $PYTHON_FILE.zip s3://$S3_BUCKET/$PYTHON_FILE.zip
echo "Zip file uploaded to S3."

echo "Creating the CloudFormation stack..."
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://$TEMPLATE_FILE \
  --parameters ParameterKey=EmailAddress,ParameterValue=$EMAIL_ADDRESS
echo "CloudFormation stack creation started."

echo "Deployment process complete."