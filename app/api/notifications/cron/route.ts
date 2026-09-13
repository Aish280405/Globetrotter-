import { NextRequest, NextResponse } from "next/server";
import { runNotificationCronJob } from "@/lib/notification-service";

// This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions, or external service)
// You can call it manually at: /api/notifications/cron?key=YOUR_SECRET_KEY

export async function GET(req: NextRequest) {
  try {
    // Simple security check - use an environment variable for the secret
    const crownKey = req.nextUrl.searchParams.get("key");
    const secretKey = process.env.CRON_SECRET;

    if (!secretKey || crownKey !== secretKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Run the notification job
    await runNotificationCronJob();

    return NextResponse.json({
      status: "success",
      message: "Notification cron job executed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron endpoint error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// For testing with POST (e.g., from Postman or cron services)
export async function POST(req: NextRequest) {
  return GET(req);
}
