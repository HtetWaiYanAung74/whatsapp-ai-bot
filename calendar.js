const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});
const calendar = google.calendar({ version: 'v3', auth });

async function createEvent({ summary, description, startTime, endTime }) {
  const event = {
    summary,
    description,
    start: { dateTime: startTime, timeZone: 'Asia/Singapore' },
    end: { dateTime: endTime, timeZone: 'Asia/Singapore' },
    attendees: [{ email }],
    conferenceData: {
      createRequest: { requestId: `${Date.now()}` }, // Google Meet link
    },
  };

  const res = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
    conferenceDataVersion: 1,
  });

  return res.data.htmlLink || res.data.htmlLink;
}

module.exports = { createEvent };
