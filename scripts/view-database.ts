import prisma from "@/lib/prisma";

async function viewDatabase() {
  try {
    console.log("\n📊 GlobeTrotter Database Overview\n");

    // Users
    const users = await prisma.user.findMany({
      select: { user_id: true, email: true, role: true, created_at: true },
      take: 10,
    });
    console.log(`👥 Users (${users.length} found):`);
    console.table(users);

    // Trips
    const trips = await prisma.tripConcierge.findMany({
      select: {
        id: true,
        user_id: true,
        property_location: true,
        check_in: true,
        check_out: true,
        created_at: true,
      },
      take: 10,
    });
    console.log(`\n🏖️ Trips (${trips.length} found):`);
    console.table(trips);

    // Local Venues
    const venues = await prisma.localVenue.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        rating: true,
      },
      take: 15,
    });
    console.log(`\n🍽️ Venues (${venues.length} found):`);
    console.table(venues);

    // Notifications
    const notifications = await prisma.notificationLog.findMany({
      select: {
        id: true,
        user_id: true,
        message_type: true,
        status: true,
        created_at: true,
      },
      take: 10,
    });
    console.log(`\n🔔 Notifications (${notifications.length} found):`);
    console.table(notifications);

    // Conversation History
    const conversations = await prisma.conversationHistory.findMany({
      select: {
        id: true,
        user_id: true,
        role: true,
        message: true,
        created_at: true,
      },
      take: 10,
    });
    console.log(`\n💬 Conversations (${conversations.length} found):`);
    console.table(conversations);

    console.log("\n✅ Database view complete!");
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

viewDatabase();
