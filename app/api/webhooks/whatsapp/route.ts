import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/chat-agent";
import prisma from "@/lib/prisma";

// WhatsApp webhook for receiving messages
// To set up with Twilio:
// 1. Get TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN from Twilio console
// 2. Point Twilio webhook to: https://yourdomain.com/api/webhooks/whatsapp
// 3. Set TWILIO_WHATSAPP_FROM in .env.local

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
    // Option 1: Using Twilio SDK
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155552671"; // Twilio sandbox

      await client.messages.create({
        body: message,
        from: fromNumber,
        to: `whatsapp:${phoneNumber}`,
      });

      console.log(
        `✅ WhatsApp message sent to ${phoneNumber}: ${message.substring(0, 50)}...`
      );
      return true;
    }

    // Option 2: Using WhatsApp Business API via Twilio (commented out)
    // const response = await fetch('https://graph.instagram.com/v18.0/YOUR_PHONE_ID/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: phoneNumber,
    //     type: 'text',
    //     text: { body: message }
    //   })
    // });

    // Fallback: just log (for development without Twilio)
    console.log(
      `📱 [DEV] WhatsApp message to ${phoneNumber}: ${message.substring(0, 50)}...`
    );
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

async function getUserFromPhoneNumber(phoneNumber: string) {
  try {
    // Try to find user by their active trip check-in
    // WhatsApp typically sends numbers with country code (e.g., +919876543210)
    const cleanPhone = phoneNumber.replace(/\D/g, ""); // Remove non-digits

    // First, try finding by any trip association
    const tripConcierge = await prisma.tripConcierge.findFirst({
      where: {
        // Join with user to search
      },
      include: {
        user: true,
      },
    });

    if (tripConcierge?.user) {
      return tripConcierge.user;
    }

    // Fallback: find by email pattern match
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: cleanPhone,
          mode: "insensitive",
        },
      },
    });

    return user || null;
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
        `⚠️ User not found for phone number ${phoneNumber}. Using demo/guest mode.`
      );
      // In production, you might create a temporary user or use a demo account
    }

    // Get active trip (if exists)
    const trip = user
      ? await prisma.tripConcierge.findFirst({
          where: {
            user_id: user.user_id,
            check_in: { lte: new Date() },
            check_out: { gte: new Date() },
          },
        })
      : null;

    // For now, use simple conversation without persisting history
    // (conversationHistory table may not exist in schema)
    const conversationHistory: { role: "user" | "assistant"; content: string }[] = [];

    // Get AI response using chat agent
    console.log(`🤖 Getting response from chat agent for: "${userMessage}"`);
    const response = await chat(userMessage, conversationHistory);

    console.log(
      `✨ Chat response: "${response.message.substring(0, 100)}..."`
    );

    // Send response back via WhatsApp
    const success = await sendWhatsAppMessage(phoneNumber, response.message);

    if (!success) {
      console.error("Failed to send WhatsApp message");
    }

    // Log conversation if we have a user and table exists
    if (user) {
      try {
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
              intent: response.intent,
            } as any,
          },
        });
      } catch (logError) {
        console.warn("Could not log conversation to database:", logError);
        // Don't fail if logging doesn't work
      }
    }
  } catch (error) {
    console.error("Error handling message:", error);

    // Send error message back
    const errorMessage =
      "Sorry, I encountered an error. Please try again or contact support.";
    await sendWhatsAppMessage(message.from, errorMessage);
  }
}
