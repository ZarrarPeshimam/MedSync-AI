import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Scopes we need for Google Calendar
export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events", // create/edit events
  "https://www.googleapis.com/auth/calendar.readonly"
];

// Generate Auth URL to send user for login
export const getAuthUrl = (userId) => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline", // important to get refresh_token
    prompt: "consent",      // forces showing consent screen
    scope: SCOPES,
    state: userId,
  });
};

// Exchange code for tokens
export const getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens; // contains access_token, refresh_token
};