const { google } = require('googleapis');

const usersTokens = {};

function saveUserTokens(userId, tokens) {
  if (!usersTokens[userId]) usersTokens[userId] = {};

  if (tokens.refresh_token) {
    usersTokens[userId].refresh_token = tokens.refresh_token;
  }
  if (tokens.access_token) {
    usersTokens[userId].access_token = tokens.access_token;
    usersTokens[userId].expiry_date = tokens.expiry_date;
  }
}

async function getAuthenticatedClient(userId) {
  const userTokens = usersTokens[userId];

  if (!userTokens) {
    throw new Error(`No tokens found for user: ${userId}`);
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    access_token: userTokens.access_token,
    refresh_token: userTokens.refresh_token,
    expiry_date: userTokens.expiry_date,
  });

  // Listen for automatic token refresh
  oAuth2Client.on('tokens', (tokens) => {
    console.log(`Tokens refreshed for user ${userId}`);
    saveUserTokens(userId, tokens);
  });

  return oAuth2Client;
}

// Export both functions
module.exports = {
  getAuthenticatedClient,
  saveUserTokens,
  usersTokens,
};
