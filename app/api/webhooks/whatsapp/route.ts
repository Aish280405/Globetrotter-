import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/chat-agent";
import prisma from "@/lib/prisma";

// WhatsApp webhook for receiving messages
// Integrate with Twilio, WhatsApp Business API, or similar service

interface WhatsAppWebhookMessage {
  from: string; // WhatsApp phone number
  body: string; // Message text
  timestamp?: string;
  wamid?: string; // WhatsApp Message ID
}

interface WhatsAppWebhookPayload {
  entry: Array<{
    changes: Array<{
      value: {
        messages?: WhatsAppWebhookMessage[];
        statuses?: Array<{
          id: string;
          status: "delivered" | "read" | "failed";
        }>;
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
      };
    }>;
  }>;
}

async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    // Integration point for WhatsApp Business API or Twilio
    // Example with Twilio:
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: message,
    //   from: 'whatsapp:+1234567890', // Your WhatsApp Business number
    //   to: `whatsapp:${phoneNumber}`
    // });

    console.log(
      `📱 WhatsApp message sent to ${phoneNumber}: ${message.substring(0, 50)}...`
    );
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

async function getUserFromPhoneNumber(phoneNumber: string) {
  try {
    // Try to find user by email or phone field
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: phoneNumber } },
          // Add phone field if available in schema
        ],
      },
    });

    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

async function getActiveTripForUser(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trip = await prisma.tripConcierge.findFirst({
      where: {
        user_id: userId,
        check_in: { lte: today },
        check_out: { gte: today },
      },
    });

    return trip;
  } catch (error) {
    console.error("Error finding active trip:", error);
    return null;
  }
}

// Verify webhook (initial handshake from WhatsApp)
export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge");

    const verifyToken = process.env.WHATSAPP_WEBHOOK_TOKEN || "gaia_is_awesome";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("✅ WhatsApp webhook verified");
      return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  } catch (error) {
    console.error("Webhook verification error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// Handle incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WhatsAppWebhookPayload;

    console.log("📨 WhatsApp webhook received:", JSON.stringify(body, null, 2));

    // Process messages
    if (body.entry && body.entry[0] && body.entry[0].changes) {
      for (const change of body.entry[0].changes) {
        if (change.value.messages) {
          for (const message of change.value.messages) {
            await handleIncomingMessage(message);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

async function handleIncomingMessage(message: WhatsAppWebhookMessage) {
  try {
    const phoneNumber = message.from;
    const userMessage = message.body;

    console.log(`💬 Message from ${phoneNumber}: ${userMessage}`);

    // Find or create user associated with this phone number
    let user = await getUserFromPhoneNumber(phoneNumber);

    if (!user) {
      console.log(
        `⚠️ User not found for phone number ${phoneNumber}. Using demo mode.`
      );
      // In production, you might create a user or use a demo account
    }

    // Get active trip (if exists)
    const trip = user ? await getActiveTripForUser(user.user_id) : null;

    // Get conversation history from database
    const history = user
      ? await prisma.conversationHistory.findMany({
          where: {
            user_id: user.user_id,
            trip_id: trip?.id || null,
          },
          orderBy: { created_at: "desc" },
          take: 10,
        })
      : [];

    // Prepare conversation history for AI
    const conversationHistory = history
      .reverse()
      .map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.message,
      }));

    // Get AI response using existing chat agent
    const response = await chat(userMessage, conversationHistory);

    // Save to conversation history
    if (user) {
      await prisma.conversationHistory.create({
        data: {
          user_id: user.user_id,
          trip_id: trip?.id || null,
          role: "user",
          message: userMessage,
        },
      });

      await prisma.conversationHistory.create({
        data: {
          user_id: user.user_id,
          trip_id: trip?.id || null,
          role: "assistant",
          message: response.message,
          metadata: {
            tools_used: response.tools_used,
          } as any,
        },
      });
    }

    // Send response back via WhatsApp
    await sendWhatsAppMessage(phoneNumber, response.message);
  } catch (error) {
    console.error("Error handling message:", error);

    // Send error message back
    const errorMessage =
      "Sorry, I encountered an error. Please try again or contact support.";
    await sendWhatsAppMessage(message.from, errorMessage);
  }
}
