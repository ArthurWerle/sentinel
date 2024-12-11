const AWS = require('aws-sdk');
const puppeteer = require('puppeteer');
const utils = require('./utils')
const constants = require('./constants')

const { findPrice, extractIdFromUrl } = utils
const { VENDOR_URLS, TABLE_NAME } = constants

const dynamodb = new AWS.DynamoDB.DocumentClient();

const ses = new AWS.SES({ region: process.env.AWS_REGION });
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

async function scrapePrices() {
  const items = {};

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const url of VENDOR_URLS) {
    await page.goto(url);

    const price = await page.evaluate(async () => {
      const priceElement = await findPrice(page);
      console.log("Price found on vendor ", url, " is ", priceElement)
      return priceElement
    });

    const id = extractIdFromUrl(url)
    items[id] = {
      price: price,
      url: url
    }
  }

  await browser.close();
  return items;
}

async function checkAndAlert(newItems) {
  try {
    const existingPrices = await dynamodb.scan({ 
      TableName: TABLE_NAME
    }).promise();

    let message = '';
    for (const newItemKey in newItems) {
      const newPrice = newItems[newItemKey].price;
      const url = newItems[newItemKey].url;
      console.log({ newItemKey, existingPrices })
      const existingItem = existingPrices.Items.find(item => item.id === newItems[newItemKey].id);
      const oldPrice = existingItem?.price;
      if (!oldPrice || newPrice < oldPrice) {
        message += `O preço do ${url} diminui de R$${oldPrice?.toFixed(2) ?? 'N/A'} para R$${newPrice.toFixed(2)}\n`;
      }
    }

    for (const newItemKey in newItems) {
      const newPrice = newItems[newItemKey].price;
      const url = newItems[newItemKey].url;

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: { id: 'prices', url: url, price: newPrice }
      }).promise();
    }

    if (message) {
      await ses.sendEmail({
        Destination: { ToAddresses: [RECIPIENT_EMAIL] },
        Message: {
          Body: { Text: { Data: message } },
          Subject: { Data: '🚨 Alerta queda de preço de imóvel 🚨' }
        },
        Source: SENDER_EMAIL
      }).promise();
      console.log('Email sent successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

exports.handler = async (event) => {
  const newPrices = await scrapePrices();
  await checkAndAlert(newPrices);
  return { statusCode: 200, body: 'CPU price check and alert complete' };
};