import prisma from "./prisma";
import { addDays, isTomorrow, isToday } from "date-fns";

export type NotificationType = "weather" | "logistics" | "event" | "tip";

interface NotificationPayload {
  tripId: string;
  phoneNumber?: string;
  messageType: NotificationType;
  content: string;
}

// Predefined notification templates
const notificationTemplates = {
  weather_rain:
    "☔ Rain expected tomorrow in Goa. We've updated your indoor plan recommendations. Check your itinerary!",
  weather_sunny:
    "☀️ Perfect sunny weather expected! Great day for beach activities. Don't forget sunscreen!",
  checkin_tomorrow:
    "🏨 Your check-in is tomorrow! Here's parking info: Paid parking available near most Goa beaches. We recommend arriving after 2 PM.",
  checkin_today:
    "🎉 Welcome to Goa! Your concierge is ready to help. Text 'help' for recommendations or ask specific questions.",
  event_happening:
    "🎉 Tonight: Full moon beach party at Anjuna Beach! Gates open 9 PM. Music, food, dancing. Want a ride recommendation?",
  event_weekend:
    "🎪 This weekend: Goa Carnival celebrations with parades and local food. Perfect for cultural experience!",
  tip_restaurant:
    "🍽️ Pro tip: Peak restaurant hours are 7-9 PM. Make reservations in advance for popular spots like Thalassa or The Fishery.",
  tip_transport:
    "🚕 Pro tip: Use Uber/Ola for safe, reliable transport. Local taxis are available but negotiate prices upfront.",
  tip_safety:
    "🛡️ Safety reminder: Keep valuables secure, use registered taxis at night, stay in well-lit areas.",
};

// Determine which notifications to send based on trip dates and context
export async function generateNotificationsForTrip(tripId: string) {
  try {
    const trip = await prisma.tripConcierge.findUnique({
      where: { id: tripId },
      include: { user: true },
    });

    if (!trip) {
      console.log("Trip not found:", tripId);
      return [];
    }

    const notifications: NotificationPayload[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInDate = new Date(trip.check_in);
    checkInDate.setHours(0, 0, 0, 0);

    const checkOutDate = new Date(trip.check_out);
    checkOutDate.setHours(0, 0, 0, 0);

    // Check-in tomorrow notification
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (checkInDate.getTime() === tomorrow.getTime()) {
      notifications.push({
        tripId,
        phoneNumber: trip.user.email,
        messageType: "logistics",
        content:
          notificationTemplates.checkin_tomorrow,
      });
    }

    // Check-in today notification
    if (checkInDate.getTime() === today.getTime()) {
      notifications.push({
        tripId,
        phoneNumber: trip.user.email,
        messageType: "logistics",
        content: notificationTemplates.checkin_today,
      });
    }

    // Add event notifications (if guest is during their trip)
    if (
      today >= checkInDate &&
      today <= checkOutDate
    ) {
      // Weekend event
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 5) {
        // Friday
        notifications.push({
          tripId,
          phoneNumber: trip.user.email,
          messageType: "event",
          content: notificationTemplates.event_weekend,
        });
      }

      // Daily tips rotation
      const tipOptions = [
        notificationTemplates.tip_restaurant,
        notificationTemplates.tip_transport,
        notificationTemplates.tip_safety,
      ];
      const tip = tipOptions[dayOfWeek % tipOptions.length];
      notifications.push({
        tripId,
        phoneNumber: trip.user.email,
        messageType: "tip",
        content: tip,
      });
    }

    return notifications;
  } catch (error) {
    console.error("Error generating notifications:", error);
    return [];
  }
}

export async function sendNotification(
  payload: NotificationPayload
): Promise<boolean> {
  try {
    // Log notification to database
    await prisma.notificationLog.create({
      data: {
        trip_id: payload.tripId,
        message_type: payload.messageType.toUpperCase() as any,
        message_content: payload.content,
        phone_number: payload.phoneNumber,
        status: "SENT",
        sent_at: new Date(),
        metadata: {
          delivery_method: "whatsapp", // In production: WhatsApp API
          timestamp: new Date().toISOString(),
        } as any,
      },
    });

    console.log(
      `✓ Notification sent to ${payload.phoneNumber}: ${payload.messageType}`
    );

    // In production, integrate with WhatsApp Business API or Twilio
    // For now, we're logging it
    // Example WhatsApp integration:
    // await sendWhatsAppMessage(payload.phoneNumber, payload.content);

    return true;
  } catch (error) {
    console.error("Error sending notification:", error);

    // Log failed notification
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
    } catch (logError) {
      console.error("Error logging failed notification:", logError);
    }

    return false;
  }
}

// Main cron job: Run this every day at 8 AM, 2 PM, 8 PM
export async function runNotificationCronJob() {
  try {
    console.log(
      "🔔 Running notification cron job at",
      new Date().toISOString()
    );

    // Get all active trips (check-in <= today <= check-out)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeTips = await prisma.tripConcierge.findMany({
      where: {
        check_in: {
          lte: today,
        },
        check_out: {
          gte: today,
        },
      },
    });

    console.log(`Found ${activeTips.length} active trips`);

    let successCount = 0;
    let failureCount = 0;

    for (const trip of activeTips) {
      const notifications = await generateNotificationsForTrip(trip.id);

      for (const notif of notifications) {
        const sent = await sendNotification(notif);
        if (sent) {
          successCount++;
        } else {
          failureCount++;
        }
      }
    }

    console.log(
      `✅ Notification job complete: ${successCount} sent, ${failureCount} failed`
    );
  } catch (error) {
    console.error("Cron job error:", error);
  }
}
