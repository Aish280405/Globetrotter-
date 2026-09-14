import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ unreadCount: 0 });
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
      return NextResponse.json({ unreadCount: 0 });
    }

    const unreadCount = await prisma.notificationLog.count({
      where: {
        trip: {
          user_id: user.user_id,
        },
        is_read: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("[notifications/unread-count]", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
