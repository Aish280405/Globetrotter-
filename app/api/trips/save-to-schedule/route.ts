import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { sendNotification } from "@/lib/notification-service";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId, propertyLocation, checkIn, checkOut, itinerary, phoneNumber } = body;

    if (!tripId || !propertyLocation || !checkIn || !checkOut || !itinerary) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedPhone = typeof phoneNumber === "string"
      ? phoneNumber.trim().replace(/[^+\d]/g, "")
      : "";
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Enter a valid WhatsApp number with country code, for example +919876543210" },
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

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { phone_number: normalizedPhone },
    });

    // Send the confirmation only for a newly created schedule entry. Re-saving
    // an itinerary updates the trip without sending duplicate WhatsApp alerts.
    const existingTrip = await prisma.tripConcierge.findUnique({
      where: { id: tripId },
      select: { id: true },
    });

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

    let confirmationSent = false;
    if (!existingTrip) {
      const checkInDate = new Date(checkIn).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      const checkOutDate = new Date(checkOut).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      confirmationSent = await sendNotification({
        tripId: trip.id,
        phoneNumber: normalizedPhone,
        messageType: "logistics",
        content: `Your ${propertyLocation} trip is saved for ${checkInDate} to ${checkOutDate}. Your GlobeTrotter concierge will send timely updates here.`,
      });
    }

    return NextResponse.json({
      success: true,
      trip_id: trip.id,
      message: "Trip saved to My Schedule",
      confirmationSent,
    });
  } catch (error) {
    console.error("[trips/save-to-schedule]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
