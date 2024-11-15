const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: process.env.AWS_REGION });

exports.run = async () => {
  const time = new Date();
  console.log(`Your cron function ran at ${time}`);

  const params = {
    Destination: {
      ToAddresses: [process.env.RECIPIENT_EMAIL],
    },
    Message: {
      Body: {
        Text: {
          Data: `The cron job ran successfully at ${time}`,
        },
      },
      Subject: {
        Data: 'Cron Job Execution Report',
      },
    },
    Source: process.env.SENDER_EMAIL,
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log('Email sent successfully:', result);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};