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

    // Fetch all trip_concierge records for this user
    const trips = await prisma.tripConcierge.findMany({
      where: {
        user_id: user.user_id,
      },
      orderBy: {
        check_in: "asc",
      },
      select: {
        id: true,
        property_name: true,
        property_location: true,
        check_in: true,
        check_out: true,
        itinerary: true,
        preferences: true,
        created_at: true,
      },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("[trips/user-trips]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
