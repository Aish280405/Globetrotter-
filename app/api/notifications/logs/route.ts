import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First try to find user by Clerk userId directly
    let user = await prisma.user.findUnique({ where: { user_id: userId } });

    // Fallback: look up by email (for users created before Clerk webhook)
    if (!user) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
      if (email) {
        user = await prisma.user.findUnique({ where: { email } });
      }
    }

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
        sent_at: true,
        phone_number: true,
      },
    });

    return NextResponse.json(notificationLogs);
  } catch (error) {
    console.error("[notifications/logs]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
