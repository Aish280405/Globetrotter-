require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log("🌱 Seeding local venues for Goa...");

    // Restaurants
    const restaurants = [
      {
        name: "Thalassa",
        location: "Baga",
        type: "RESTAURANT",
        rating: 4.5,
        tags: ["Greek", "Seafood", "Upscale"],
        image_url: "https://example.com/thalassa.jpg",
        phone: "+91-832-227-7676",
        website: "thalassa.com",
      },
      {
        name: "Pepper's Shack",
        location: "Baga",
        type: "RESTAURANT",
        rating: 4.2,
        tags: ["Casual", "Seafood", "Budget-Friendly"],
        image_url: "https://example.com/peppers.jpg",
      },
      {
        name: "Cavala",
        location: "Anjuna",
        type: "RESTAURANT",
        rating: 4.3,
        tags: ["Seafood", "Ocean View", "Casual"],
        image_url: "https://example.com/cavala.jpg",
      },
      {
        name: "Little Italy",
        location: "Anjuna",
        type: "RESTAURANT",
        rating: 4.1,
        tags: ["Pasta", "Pizza", "Italian"],
        image_url: "https://example.com/littleitaly.jpg",
      },
      {
        name: "The Fishery",
        location: "Palolem",
        type: "RESTAURANT",
        rating: 4.4,
        tags: ["Upscale", "Seafood", "Fine Dining"],
        image_url: "https://example.com/fishery.jpg",
      },
      {
        name: "Magic Italy",
        location: "Palolem",
        type: "RESTAURANT",
        rating: 4.0,
        tags: ["Beachside", "Dining", "Italian"],
        image_url: "https://example.com/magicitaly.jpg",
      },
      {
        name: "Sardar Tea Stall",
        location: "Panjim",
        type: "RESTAURANT",
        rating: 3.8,
        tags: ["Local", "Chai", "Casual"],
        image_url: "https://example.com/sardar.jpg",
      },
    ];

    // Activities
    const activities = [
      {
        name: "Dudhsagar Waterfalls Trek",
        location: "South Goa",
        type: "ACTIVITY",
        rating: 4.6,
        tags: ["Trekking", "Nature", "Waterfall"],
        image_url: "https://example.com/dudhsagar.jpg",
      },
      {
        name: "Boat Trip to Anjuna Flea Market",
        location: "Anjuna",
        type: "ACTIVITY",
        rating: 4.2,
        tags: ["Shopping", "Culture", "Market"],
        image_url: "https://example.com/fleamarket.jpg",
      },
      {
        name: "Scuba Diving",
        location: "Baga",
        type: "ACTIVITY",
        rating: 4.4,
        tags: ["Water Sports", "Adventure", "Marine"],
        image_url: "https://example.com/scuba.jpg",
      },
      {
        name: "Old Goa Heritage Walk",
        location: "Panjim",
        type: "ACTIVITY",
        rating: 4.1,
        tags: ["Culture", "History", "Walking"],
        image_url: "https://example.com/oldgoa.jpg",
      },
      {
        name: "Sunset Beach Yoga",
        location: "Baga",
        type: "ACTIVITY",
        rating: 4.3,
        tags: ["Wellness", "Yoga", "Relaxation"],
        image_url: "https://example.com/yoga.jpg",
      },
    ];

    // Clear existing venues
    await prisma.localVenue.deleteMany({});
    console.log("✓ Cleared existing venues");

    // Insert restaurants
    for (const restaurant of restaurants) {
      await prisma.localVenue.create({
        data: restaurant,
      });
    }
    console.log(`✓ Created ${restaurants.length} restaurants`);

    // Insert activities
    for (const activity of activities) {
      await prisma.localVenue.create({
        data: activity,
      });
    }
    console.log(`✓ Created ${activities.length} activities`);

    console.log("\n✅ Seed complete!");
    console.log(`Total venues: ${restaurants.length + activities.length}`);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
