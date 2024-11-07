#!/bin/bash

# Set the necessary variables
STACK_NAME="WebCrawlerApp"
TEMPLATE_FILE="crawler.yml"
S3_BUCKET="web-crawler-app-code"
PYTHON_FILE="app.py"

# Create the S3 bucket if it doesn't exist
echo "Checking if the S3 bucket exists..."
aws s3api head-bucket --bucket $S3_BUCKET 2>/dev/null
if [ $? -ne 0 ]; then
  echo "Bucket does not exist. Creating the bucket..."
  aws s3api create-bucket --bucket $S3_BUCKET --region us-east-1
  echo "Bucket created."
else
  echo "Bucket already exists."
fi

# Create the zip file
echo "Zipping the Python file..."
zip $PYTHON_FILE.zip $PYTHON_FILE
echo "Zip file created."

# Upload the zip file to S3
echo "Uploading the zip file to S3..."
aws s3 cp $PYTHON_FILE.zip s3://$S3_BUCKET/$PYTHON_FILE.zip
echo "Zip file uploaded to S3."

# Create the CloudFormation stack
echo "Creating the CloudFormation stack..."
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://$TEMPLATE_FILE \
  --parameters ParameterKey=S3Bucket,ParameterValue=$S3_BUCKET \
  --capabilities CAPABILITY_IAM
echo "CloudFormation stack creation started."

echo "Deployment process complete."