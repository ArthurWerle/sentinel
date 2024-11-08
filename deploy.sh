#!/bin/bash

STACK_NAME="WebCrawlerApp"
TEMPLATE_FILE="crawler.yml"
PYTHON_FILE="app.py"
S3_BUCKET="crawler-lambda-code-unique-id"
AWS_REGION="us-east-1"

# ANSI escape codes for colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check stack events
check_stack_events() {
    echo -e "${YELLOW}Checking stack events...${NC}"
    if aws cloudformation describe-stack-events --stack-name $STACK_NAME 2>/dev/null; then
        aws cloudformation describe-stack-events \
            --stack-name $STACK_NAME \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceStatusReason]' \
            --output text
    else
        echo -e "${RED}Stack does not exist.${NC}"
    fi
}

echo -e "${BLUE}Setting default region to ${AWS_REGION}"
aws configure set default.region $AWS_REGION

# Create the S3 bucket if it doesn't exist
echo -e "${BLUE}Checking if the S3 bucket exists...${NC}"
aws s3api head-bucket --bucket $S3_BUCKET 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${GREEN}Bucket does not exist. Creating the bucket...${NC}"
    aws s3api create-bucket --bucket $S3_BUCKET
    echo -e "${GREEN}Bucket created.${NC}"
else
    echo -e "${GREEN}Bucket already exists.${NC}"
fi

# Upload the Python file to S3
echo -e "${BLUE}Uploading the Python file to S3...${NC}"
aws s3 cp $PYTHON_FILE s3://$S3_BUCKET/$PYTHON_FILE 
echo -e "${GREEN}Python file uploaded to S3.${NC}"

# Check if the CloudFormation stack exists
echo -e "${BLUE}Checking if the CloudFormation stack exists...${NC}"
aws cloudformation describe-stacks --stack-name $STACK_NAME --no-cli-pager 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}Stack already exists. Deleting the stack...${NC}"
    aws cloudformation delete-stack --stack-name $STACK_NAME
    echo -e "${YELLOW}Waiting for stack deletion to complete...${NC}"
    aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME
    echo -e "${GREEN}Stack deleted.${NC}"
else
    echo -e "${GREEN}Stack does not exist.${NC}"
fi

# Create the CloudFormation stack
echo -e "${BLUE}Creating the CloudFormation stack...${NC}"
if ! aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters ParameterKey=PythonFile,ParameterValue=$PYTHON_FILE \
    --parameters ParameterKey=S3Bucket,ParameterValue=$S3_BUCKET \
    --capabilities CAPABILITY_IAM; then
    echo -e "${RED}Failed to create stack. Checking events...${NC}"
    check_stack_events
    exit 1
fi

echo -e "${YELLOW}Waiting for stack creation to complete...${NC}"
if ! aws cloudformation wait stack-create-complete --stack-name $STACK_NAME; then
    echo -e "${RED}Stack creation failed. Checking events...${NC}"
    check_stack_events
    exit 1
fi

echo -e "${GREEN}Deployment process complete.${NC}"