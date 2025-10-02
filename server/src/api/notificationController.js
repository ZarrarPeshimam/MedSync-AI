// controllers/notificationController.js
import { sampleMeds } from "../utils/sampleData.js";
import notifier from "node-notifier";


// Helper: convert HH:mm string to Date today
function getTimeForToday(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );
  return target;
}

// Helper: convert "15m" -> ms
function parseDuration(str) {
  if (!str) return 0;
  const unit = str.slice(-1);
  const value = parseInt(str);
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  return 0;
}

// ✅ Node desktop notification helper
function sendNotification(title, body) {
  notifier.notify({
    title,
    message: body,
    sound: true, // play a sound (optional)
    wait: false  // don’t wait for user interaction
  });

  console.log(`[NOTIFY] ${title}: ${body}`);
}

export default function startNotificationScheduler() {
  console.log("📅 Starting daily medication notification scheduler...");

  // 🔹 Dummy test notification (fires in 10 seconds)
  setTimeout(() => {
    sendNotification("🔔 Test Notification", "This is a dummy test alert!");
  }, 10 * 1000);

  // Sort medicines by time
  const todaysMeds = sampleMeds.sort(
    (a, b) => getTimeForToday(a.time) - getTimeForToday(b.time)
  );

  todaysMeds.forEach((med) => {
    const medTime = getTimeForToday(med.time);

    // Before notification
    const beforeMs = medTime.getTime() - parseDuration(med.remindBefore);
    if (beforeMs > Date.now()) {
      setTimeout(() => {
        sendNotification(
          "Medicine Reminder ⏰",
          `Take ${med.pillName} in ${med.remindBefore}`
        );
      }, beforeMs - Date.now());
    }

    // On-time notification
    if (medTime.getTime() > Date.now()) {
      setTimeout(() => {
        sendNotification(
          "Time to Take Medicine 💊",
          `Take ${med.pillName} now`
        );
      }, medTime.getTime() - Date.now());
    }

    // After notification
    const afterMs = medTime.getTime() + parseDuration(med.remindAfter);
    if (afterMs > Date.now()) {
      setTimeout(() => {
        sendNotification(
          "Missed Dose ❗",
          `Did you forget ${med.pillName}?`
        );
      }, afterMs - Date.now());
    }
  });
}
