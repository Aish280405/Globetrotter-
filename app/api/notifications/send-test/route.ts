import { NextRequest, NextResponse } from "next/server";
import { runNotificationCronJob } from "@/lib/notification-service";

// Test endpoint to manually trigger notification job
// Usage: POST /api/notifications/send-test?secret=YOUR_SECRET

export async function POST(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Run the notification job
    await runNotificationCronJob();

    return NextResponse.json({
      status: "success",
      message: "Notifications sent to all active trips",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET for easy testing from browser
export async function GET(req: NextRequest) {
  return POST(req);
}
