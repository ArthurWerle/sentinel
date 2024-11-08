import boto3
import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

def handler(event, context):
    logging.info("Web Crawler function started")
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('PriceHistory')

    # Example code to put an item in DynamoDB
    table.put_item(
        Item={
            'ProductId': 'product_123',
            'Timestamp': str(datetime.datetime.now()),
            'Price': 99.99
        }
    )

    logging.info("Data saved to DynamoDB")
    return {
        'statusCode': 200,
        'body': 'Data saved to DynamoDB'
    }