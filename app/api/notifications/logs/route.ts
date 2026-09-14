import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Helper: Get user from Clerk or fallback to email lookup
async function getUser(userId: string) {
  let user = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
  }
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json([]);
    }

    const notificationLogs = await prisma.notificationLog.findMany({
      where: {
        trip: {
          user_id: user.user_id,
        },
      },
      orderBy: { sent_at: "desc" },
      take: 100,
      select: {
        id: true,
        trip_id: true,
        message_type: true,
        message_content: true,
        status: true,
        is_read: true,
        sent_at: true,
        phone_number: true,
      },
    });

    return NextResponse.json(notificationLogs);
  } catch (error) {
    console.error("[notifications/logs GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      await prisma.notificationLog.updateMany({
        where: {
          trip: {
            user_id: user.user_id,
          },
          is_read: false,
        },
        data: {
          is_read: true,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "All marked as read" });
    }

    if (notificationId) {
      // Mark single notification as read
      const notif = await prisma.notificationLog.findUnique({
        where: { id: notificationId },
        include: { trip: true },
      });

      if (!notif) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      // Verify ownership
      if (notif.trip.user_id !== user.user_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      await prisma.notificationLog.update({
        where: { id: notificationId },
        data: {
          is_read: true,
          updated_at: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing notificationId or markAllAsRead" }, { status: 400 });
  } catch (error) {
    console.error("[notifications/logs PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
