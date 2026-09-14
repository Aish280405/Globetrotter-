// Simple database viewer
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function viewDatabase() {
  try {
    console.log("\n📊 GlobeTrotter Database Overview\n");

    // Users
    console.log("👥 USERS:");
    const users = await prisma.user.findMany({
      select: { user_id: true, email: true, role: true, created_at: true },
      take: 5,
    });
    if (users.length === 0) {
      console.log("  No users found");
    } else {
      users.forEach((u) => {
        console.log(
          `  - ${u.email} (ID: ${u.user_id}, Role: ${u.role}, Created: ${u.created_at.toISOString().split("T")[0]})`
        );
      });
    }

    // Trips
    console.log("\n🏖️ TRIPS:");
    const trips = await prisma.tripConcierge.findMany({
      select: {
        id: true,
        user_id: true,
        property_location: true,
        check_in: true,
        check_out: true,
      },
      take: 5,
    });
    if (trips.length === 0) {
      console.log("  No trips found");
    } else {
      trips.forEach((t) => {
        console.log(
          `  - ${t.property_location} (${t.check_in.toISOString().split("T")[0]} to ${t.check_out.toISOString().split("T")[0]})`
        );
      });
    }

    // Local Venues
    console.log("\n🍽️ LOCAL VENUES:");
    const venues = await prisma.localVenue.findMany({
      select: { id: true, name: true, type: true, location: true, rating: true },
      take: 10,
    });
    console.log(`  Total venues: ${venues.length}`);
    if (venues.length > 0) {
      venues.slice(0, 5).forEach((v) => {
        console.log(
          `  - ${v.name} (${v.type}, Location: ${v.location}, Rating: ${v.rating}⭐)`
        );
      });
      if (venues.length > 5) {
        console.log(`  ... and ${venues.length - 5} more`);
      }
    }

    // Notifications
    console.log("\n🔔 NOTIFICATIONS:");
    const notifications = await prisma.notificationLog.findMany({
      select: {
        id: true,
        message_type: true,
        status: true,
        sent_at: true,
      },
      take: 5,
    });
    console.log(`  Total notifications: ${notifications.length}`);
    if (notifications.length > 0) {
      notifications.slice(0, 3).forEach((n) => {
        console.log(
          `  - ${n.message_type} (Status: ${n.status}, Sent: ${n.sent_at ? n.sent_at.toISOString().split("T")[0] : "pending"})`
        );
      });
    }

    // Conversations
    console.log("\n💬 CONVERSATIONS:");
    const conversations = await prisma.conversationHistory.findMany({
      select: { id: true, user_id: true, role: true, message: true },
      take: 5,
    });
    console.log(`  Total messages: ${conversations.length}`);
    if (conversations.length > 0) {
      console.log("  Sample conversations:");
      conversations.slice(0, 3).forEach((c) => {
        const preview = c.message.substring(0, 50) + (c.message.length > 50 ? "..." : "");
        console.log(`  - ${c.role}: ${preview}`);
      });
    }

    console.log("\n✅ Database view complete!\n");
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

viewDatabase();
