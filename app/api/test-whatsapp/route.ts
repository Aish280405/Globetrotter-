import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-test-whatsapp-key");
    if (!process.env.TEST_WHATSAPP_API_KEY || apiKey !== process.env.TEST_WHATSAPP_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: "phoneNumber and message are required" },
        { status: 400 }
      );
    }

    // Test Twilio integration
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
      
      // Convert phone number to WhatsApp format if needed
      const toNumber = phoneNumber.startsWith("whatsapp:") 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;

      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber,
      });

      return NextResponse.json({
        success: true,
        messageSid: result.sid,
        status: result.status,
        message: "WhatsApp message sent successfully!",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Twilio credentials not configured",
    });
  } catch (error) {
    console.error("WhatsApp test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "WhatsApp Test Endpoint",
    usage: "POST with x-test-whatsapp-key and { phoneNumber: '+1234567890', message: 'test' }",
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  });
}
