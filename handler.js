const AWS = require('aws-sdk');
const puppeteer = require('puppeteer');
const utils = require('./utils')
const constants = require('./constants')

const { findPrice } = utils
const { VENDOR_URLS, TABLE_NAME } = constants

const dynamodb = new AWS.DynamoDB.DocumentClient();

const ses = new AWS.SES({ region: process.env.AWS_REGION });
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

async function scrapeCpuPrices() {
  const prices = {};

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const url of VENDOR_URLS) {
    await page.goto(url);

    const price = await page.evaluate(async () => {
      const priceElement = await findPrice(page);
      console.log("Price found on vendor ", url, " is ", priceElement)
      return priceElement
    });

    let cpu;
    if (url.includes('14600')) {
      cpu = '14600';
    } else if (url.includes('13700')) {
      cpu = '13700';
    } else {
      cpu = '12600';
    }
    prices[cpu] = price;
  }

  await browser.close();
  return prices;
}

async function checkAndAlert(newPrices) {
  try {
    const existingPrices = await dynamodb.scan({ 
      TableName: TABLE_NAME
    }).promise();

    let message = '';
    for (const cpu in newPrices) {
      const newPrice = newPrices[cpu];
      const existingItem = existingPrices.Items.find(item => item.cpu === cpu);
      const oldPrice = existingItem?.price;
      if (!oldPrice || newPrice < oldPrice) {
        message += `O preço do ${cpu} diminui de R$${oldPrice?.toFixed(2) ?? 'N/A'} para R$${newPrice.toFixed(2)}\n`;
      }
    }

    for (const cpu in newPrices) {
      const newPrice = newPrices[cpu];
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: { id: 'cpu-prices', cpu, price: newPrice }
      }).promise();
    }

    if (message) {
      await ses.sendEmail({
        Destination: { ToAddresses: [RECIPIENT_EMAIL] },
        Message: {
          Body: { Text: { Data: message } },
          Subject: { Data: '🚨 Alerta queda de preço de CPU 🚨' }
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
  const newPrices = await scrapeCpuPrices();
  await checkAndAlert(newPrices);
  return { statusCode: 200, body: 'CPU price check and alert complete' };
};