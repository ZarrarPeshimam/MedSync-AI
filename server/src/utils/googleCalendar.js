import { google } from "googleapis";
import User from "../models/User.js";

export const addMedicineToGoogleCalendar = async (userId, medicine) => {
  const user = await User.findById(userId);
  if (!user?.googleTokens) return;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(user.googleTokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Add each dose as a separate event
  for (const dose of medicine.dosageTimes) {
    const [hour, minute] = dose.time.split(":").map(Number);
    const startDateTime = new Date(medicine.startDate);
    startDateTime.setHours(hour, minute);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + 15); // default duration

    await calendar.events.insert({
      calendarId: "primary",
      resource: {
        summary: `Take ${medicine.pillName}`,
        description: medicine.pillDescription || "",
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 5 }], // reminder 5 min before
        },
      },
    });
  }
};