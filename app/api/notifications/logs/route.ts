import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Get notification logs
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return mock data (database tables don't exist yet)
    // When database is migrated, query from notificationLog table

    const mockLogs = [
      {
        id: "1",
        trip_id: "trip_1",
        message_type: "logistics",
        message_content:
          "Your check-in is tomorrow! Here's parking info...",
        status: "SENT",
        sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        trip_id: "trip_1",
        message_type: "tip",
        message_content: "Pro tip: Peak restaurant hours are 7-9 PM",
        status: "SENT",
        sent_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        trip_id: "trip_2",
        message_type: "event",
        message_content: "Full moon party at Anjuna Beach tonight!",
        status: "SENT",
        sent_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({
      logs: mockLogs,
      total: mockLogs.length,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
