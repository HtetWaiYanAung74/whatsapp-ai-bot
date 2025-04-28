const dotenv = require('dotenv');
const express = require('express');
const { google } = require('googleapis');
const { generateAIResponse } = require('./ai');
const { createEvent } = require('./calendar');
const { sendWhatsAppMessage } = require('./whatsapp');

dotenv.config();
const app = express();
app.use(express.json());

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Start OAuth login
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent', // Always get refresh_token
  });
  res.redirect(authUrl);
});

// OAuth callback endpoint
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials({
    access_token: tokens.access_token,  
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    scope: tokens.scope,
    token_type: tokens.token_type,
  });

  res.send('Authentication successful! You can now schedule your appointments.');
});

// WhatsApp Webhook Verification
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'ep_2w8OQ2X9kyMqoDP1BaixD5Eaoaw';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// Webhook Listener
app.post('/webhook', async (req, res) => {
  const entry = req.body?.entry?.[0];
  const message = entry?.changes?.[0]?.value?.messages?.[0];

  if (message && message.type === 'text') {
    const from = message.from;
    const userInput = message.text.body;

    const aiReply = await generateAIResponse(userInput);

    const jsonMatch = aiReply.match(/```json([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const eventData = JSON.parse(jsonMatch[1].trim());
        console.log(eventData, oAuth2Client);

        // Validate required fields
        const { fullName, email, dateTime, propertyType, location } = eventData;

        const eventLink = await createEvent({
          fullName, email, dateTime, propertyType, location, authClient: oAuth2Client
        });

        const followUpMessage = `${aiReply}\n\n📅 Your appointment has been scheduled! Here’s your Google Meet link: ${eventLink}`;
        await sendWhatsAppMessage(from, followUpMessage);
      } catch (error) {
        console.error('Failed to parse JSON or create event:', error);
        await sendWhatsAppMessage(from, aiReply);        
      }
    } else {
      await sendWhatsAppMessage(from, aiReply);
    }
  }
  res.sendStatus(200);
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});
