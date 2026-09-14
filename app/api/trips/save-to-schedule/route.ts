import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId, propertyLocation, checkIn, checkOut, itinerary } = body;

    if (!tripId || !propertyLocation || !checkIn || !checkOut || !itinerary) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update or create trip_concierge record
    const trip = await prisma.tripConcierge.upsert({
      where: { id: tripId },
      update: {
        property_location: propertyLocation,
        check_in: new Date(checkIn),
        check_out: new Date(checkOut),
        itinerary: itinerary as any,
      },
      create: {
        id: tripId,
        user_id: user.user_id,
        property_location: propertyLocation,
        check_in: new Date(checkIn),
        check_out: new Date(checkOut),
        itinerary: itinerary as any,
      },
    });

    return NextResponse.json({
      success: true,
      trip_id: trip.id,
      message: "Trip saved to My Schedule",
    });
  } catch (error) {
    console.error("[trips/save-to-schedule]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
