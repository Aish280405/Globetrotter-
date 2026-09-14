import prisma from "./prisma";

export type NotificationType = "weather" | "logistics" | "event" | "tip";

// WhatsApp message sending function
async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    if (!phoneNumber) return false;

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
      const toNumber = phoneNumber.startsWith("whatsapp:")
        ? phoneNumber
        : `whatsapp:${phoneNumber}`;

      await client.messages.create({ body: message, from: fromNumber, to: toNumber });
      console.log(`✅ WhatsApp sent to ${phoneNumber}`);
      return true;
    }

    console.warn("Twilio credentials are not configured; WhatsApp message was not sent");
    return false;
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return false;
  }
}

interface NotificationPayload {
  tripId: string;
  phoneNumber?: string;
  messageType: NotificationType;
  content: string;
}

// --- Notification generators per scenario ---

function preTrip3Days(location: string): string {
  return `✈️ 3 days to go! Your trip to ${location} is coming up. Here's a quick checklist: ID/passport, travel insurance, local SIM or data plan, and some cash in INR. Excited for you!`;
}

function preTrip1Day(location: string): string {
  return `🏨 Tomorrow's the day! Check-in for ${location} is tomorrow. Tip: arrive after 2 PM to avoid the rush. Pack light, the beaches are worth it!`;
}

function checkInToday(location: string): string {
  return `🎉 Welcome to ${location}! Your concierge is here. Ask me anything — restaurants, activities, transport, or local tips. Just say "help" to get started.`;
}

function duringTripTip(dayOfWeek: number): string {
  const tips = [
    "🍽️ Peak dinner hours are 7–9 PM. Reserve ahead at popular spots like Thalassa or The Fishery.",
    "🚕 Use Uber/Ola for safe rides. Local taxis are fine but agree on price upfront.",
    "🌊 Best time for beaches: early morning (7–9 AM) before the crowds and heat hit.",
    "🛡️ Keep valuables in your hotel safe. Only carry what you need for the day.",
    "🌅 Don't miss a sunset at Vagator or Palolem — usually around 6:15 PM.",
    "🍺 Kingfisher beer on a beach shack is a Goa rite of passage. Cheers! 🥂",
    "📸 Golden hour is 6–6:30 PM — great for photos at any beach.",
  ];
  return tips[dayOfWeek % tips.length];
}

function weekendEvent(): string {
  return "🎪 This weekend: Anjuna Flea Market (Wednesday), beach parties at Baga, and a sunset cruise from Panjim jetty. Want details on any of these?";
}

function weatherSunny(): string {
  return "☀️ Clear skies ahead! Perfect day for water sports or a beach walk. Sunscreen SPF 50+ recommended — the Goa sun is strong.";
}

function weatherRain(): string {
  return "☔ Rain expected today. Good day for Old Goa sightseeing, spice plantation tours, or cozy cafe time in Panjim's Fontainhas quarter.";
}

// --- Main generator ---

export async function generateNotificationsForTrip(tripId: string) {
  try {
    const trip = await prisma.tripConcierge.findUnique({
      where: { id: tripId },
      include: { user: true },
    });

    if (!trip) return [];

    const notifications: NotificationPayload[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = new Date(trip.check_in);
    checkIn.setHours(0, 0, 0, 0);

    const checkOut = new Date(trip.check_out);
    checkOut.setHours(0, 0, 0, 0);

    const daysUntilCheckIn = Math.round(
      (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const location = trip.property_location || "Goa";
    const phone = trip.user.phone_number || undefined;

    // --- PRE-TRIP notifications ---
    if (daysUntilCheckIn === 3) {
      notifications.push({
        tripId,
        phoneNumber: phone,
        messageType: "logistics",
        content: preTrip3Days(location),
      });
    }

    if (daysUntilCheckIn === 1) {
      notifications.push({
        tripId,
        phoneNumber: phone,
        messageType: "logistics",
        content: preTrip1Day(location),
      });
    }

    // --- CHECK-IN DAY ---
    if (daysUntilCheckIn === 0) {
      notifications.push({
        tripId,
        phoneNumber: phone,
        messageType: "logistics",
        content: checkInToday(location),
      });
    }

    // --- DURING TRIP notifications ---
    const isDuringTrip = today >= checkIn && today <= checkOut;

    if (isDuringTrip) {
      const dayOfWeek = today.getDay();

      // Daily tip
      notifications.push({
        tripId,
        phoneNumber: phone,
        messageType: "tip",
        content: duringTripTip(dayOfWeek),
      });

      // Weekend event nudge (Friday only)
      if (dayOfWeek === 5) {
        notifications.push({
          tripId,
          phoneNumber: phone,
          messageType: "event",
          content: weekendEvent(),
        });
      }

      // Simple weather rotation based on day (in prod: replace with real weather API)
      const weatherContent = dayOfWeek % 2 === 0 ? weatherSunny() : weatherRain();
      notifications.push({
        tripId,
        phoneNumber: phone,
        messageType: "weather",
        content: weatherContent,
      });
    }

    return notifications;
  } catch (error) {
    console.error("Error generating notifications:", error);
    return [];
  }
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // Create the notification first, then record Twilio's actual outcome.
    const notification = await prisma.notificationLog.create({
      data: {
        trip_id: payload.tripId,
        message_type: payload.messageType.toUpperCase() as any,
        message_content: payload.content,
        phone_number: payload.phoneNumber,
        status: "QUEUED",
        metadata: {
          delivery_method: "app",
          timestamp: new Date().toISOString(),
        } as any,
      },
    });

    const delivered = await sendWhatsAppMessage(payload.phoneNumber || "", payload.content);
    await prisma.notificationLog.update({
      where: { id: notification.id },
      data: delivered
        ? { status: "SENT", sent_at: new Date() }
        : { status: "FAILED", metadata: { delivery_method: "whatsapp", error: "Twilio did not accept the message" } as any },
    });

    console.log(`✓ Notification processed: [${payload.messageType}] for trip ${payload.tripId}`);
    return delivered;
  } catch (error) {
    console.error("Error saving notification:", error);

    // Try to log the failure
    try {
      await prisma.notificationLog.create({
        data: {
          trip_id: payload.tripId,
          message_type: payload.messageType.toUpperCase() as any,
          message_content: payload.content,
          phone_number: payload.phoneNumber,
          status: "FAILED",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
          } as any,
        },
      });
    } catch (_) {}

    return false;
  }
}

// Main cron job: called 3x daily (8 AM, 2 PM, 8 PM)
export async function runNotificationCronJob() {
  try {
    console.log("🔔 Running notification cron job at", new Date().toISOString());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look at trips happening in the next 3 days AND currently active trips
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const relevantTrips = await prisma.tripConcierge.findMany({
      where: {
        check_in: {
          lte: threeDaysFromNow, // trips starting within 3 days
        },
        check_out: {
          gte: today, // trips not yet finished
        },
      },
    });

    console.log(`Found ${relevantTrips.length} relevant trips`);

    let successCount = 0;
    let failureCount = 0;

    for (const trip of relevantTrips) {
      const notifications = await generateNotificationsForTrip(trip.id);
      console.log(`  Trip ${trip.id} (${trip.property_location}): ${notifications.length} notifications`);

      for (const notif of notifications) {
        const sent = await sendNotification(notif);
        sent ? successCount++ : failureCount++;
      }
    }

    console.log(`✅ Cron complete: ${successCount} sent, ${failureCount} failed`);
    return { successCount, failureCount, tripsProcessed: relevantTrips.length };
  } catch (error) {
    console.error("Cron job error:", error);
    throw error;
  }
}
