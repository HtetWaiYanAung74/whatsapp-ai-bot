const axios = require('axios');

async function sendWhatsAppMessage(recipientPhone, message) {
  const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: recipientPhone,
    text: { body: message },
  };

  await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}

module.exports = { sendWhatsAppMessage };
