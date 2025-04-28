const { google } = require('googleapis');
const moment = require('moment-timezone');
const path = require('path');
const { v4: uuid } = require('uuid');

// const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'my-service-account.json');
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const auth = new google.auth.JWT({
  // keyFile: path.join(__dirname, 'my-service-account.json'),
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

async function createEvent({ fullName, email, dateTime, propertyType, location }) {

  const startTime = moment(dateTime, 'DD MMM YYYY HH:mm', 'Asia/Singapore').format('YYYY-MM-DDTHH:mm:ssZ');
  const endTime = moment(startTime).add(30, 'm').format('YYYY-MM-DDTHH:mm:ssZ');

  const event = {
    summary: `Property Viewing: ${propertyType}`,
    location: location,
    description: `${fullName} is interested in viewing the property.`,
    start: {
      dateTime: startTime,
      timeZone: 'Asia/Singapore'
    },
    end: {
      dateTime: endTime,
      timeZone: 'Asia/Singapore'
    },
    attendees: [{ email }],
    reminders: {
      useDefault: true,
    },
    conferenceData: {
      createRequest: {
        requestId: uuid(),
      },
    },
  };

  console.log('Creating event:', event);	

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  });

  return response.data.hangoutLink;
}

module.exports = { createEvent };
