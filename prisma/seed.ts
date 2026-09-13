import { PrismaClient, VenueType } from "@prisma/client";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });
config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding local venues for Goa...");

  // Restaurants
  const restaurants = [
    {
      name: "Thalassa",
      location: "Baga",
      tags: ["seafood", "oceanview", "upscale"],
      rating: 4.7,
      phone: "+91-832-2276-352",
      website: "thalassa-goa.com",
      latitude: 15.5833,
      longitude: 73.7344,
      metadata: {
        cuisine: "Greek",
        price_range: "₹₹₹",
        hours: "7pm-midnight",
        vibe: "romantic",
      },
    },
    {
      name: "Pepper's Shack",
      location: "Baga",
      tags: ["seafood", "casual", "budget"],
      rating: 4.3,
      phone: "+91-832-2276-123",
      website: "",
      latitude: 15.5835,
      longitude: 73.7341,
      metadata: {
        cuisine: "Indian, Seafood",
        price_range: "₹₹",
        hours: "noon-11pm",
        vibe: "casual",
      },
    },
    {
      name: "Cavala Seafood Restaurant",
      location: "Anjuna",
      tags: ["seafood", "oceanview", "mid-range"],
      rating: 4.5,
      phone: "+91-832-2273-901",
      website: "",
      latitude: 15.5669,
      longitude: 73.8056,
      metadata: {
        cuisine: "Indian, Seafood",
        price_range: "₹₹",
        hours: "10am-11pm",
        vibe: "beachy",
      },
    },
    {
      name: "The Fishery",
      location: "Palolem",
      tags: ["seafood", "oceanview", "upscale"],
      rating: 4.6,
      phone: "+91-832-2644-737",
      website: "",
      latitude: 15.3981,
      longitude: 73.9347,
      metadata: {
        cuisine: "Seafood",
        price_range: "₹₹₹",
        hours: "7pm-11:30pm",
        vibe: "romantic",
      },
    },
    {
      name: "Café Coffee Day",
      location: "Panjim",
      tags: ["coffee", "cafe", "budget"],
      rating: 3.8,
      phone: "+91-832-2224-444",
      website: "",
      latitude: 15.4909,
      longitude: 73.8278,
      metadata: {
        cuisine: "Beverages, Snacks",
        price_range: "₹",
        hours: "7am-10pm",
        vibe: "casual",
      },
    },
    {
      name: "Lotus Pond",
      location: "South Goa",
      tags: ["vegetarian", "healthy", "budget"],
      rating: 4.2,
      phone: "+91-832-2420-123",
      website: "",
      latitude: 15.256,
      longitude: 73.9144,
      metadata: {
        cuisine: "Vegetarian",
        price_range: "₹",
        hours: "8am-9pm",
        vibe: "calm",
      },
    },
  ];

  // Activities
  const activities = [
    {
      name: "Baga Beach",
      location: "Baga",
      tags: ["beach", "swimming", "water-sports"],
      rating: 4.5,
      metadata: {
        type: "Beach",
        duration_mins: 180,
        best_time: "early morning, sunset",
        activities: ["swimming", "jet-ski", "parasailing"],
      },
    },
    {
      name: "Sunset Point Trek",
      location: "Baga",
      tags: ["trekking", "sunset", "scenic"],
      rating: 4.6,
      metadata: {
        type: "Trek",
        duration_mins: 90,
        difficulty: "easy",
        best_time: "4pm-6pm",
      },
    },
    {
      name: "Anjuna Flea Market",
      location: "Anjuna",
      tags: ["shopping", "culture", "budget"],
      rating: 4.3,
      metadata: {
        type: "Market",
        duration_mins: 240,
        days: "Every Wednesday",
        items: ["textiles", "jewelry", "handicrafts"],
      },
    },
    {
      name: "Dudhsagar Waterfalls",
      location: "North Goa",
      tags: ["waterfall", "trekking", "scenic"],
      rating: 4.7,
      metadata: {
        type: "Natural Wonder",
        duration_mins: 480,
        distance_from_beach: "40km",
        best_time: "monsoon, post-monsoon",
      },
    },
    {
      name: "Palolem Beach",
      location: "Palolem",
      tags: ["beach", "swimming", "backpacker"],
      rating: 4.6,
      metadata: {
        type: "Beach",
        duration_mins: 180,
        vibe: "relaxed",
        activities: ["swimming", "yoga", "beach-party"],
      },
    },
    {
      name: "Backwater Kayaking",
      location: "South Goa",
      tags: ["water-sports", "adventure", "eco-tourism"],
      rating: 4.4,
      metadata: {
        type: "Water Activity",
        duration_mins: 150,
        difficulty: "moderate",
        operator: "Available daily",
      },
    },
    {
      name: "Old Goa Churches",
      location: "Panjim",
      tags: ["culture", "history", "architecture"],
      rating: 4.4,
      metadata: {
        type: "Historical",
        duration_mins: 120,
        entry_fee: "Free",
        best_time: "early morning",
      },
    },
    {
      name: "Spice Plantation Tour",
      location: "North Goa",
      tags: ["culture", "agriculture", "organic"],
      rating: 4.3,
      metadata: {
        type: "Agro-tourism",
        duration_mins: 180,
        includes: "lunch, traditional meal",
        languages: "English, Hindi",
      },
    },
  ];

  // Transport
  const transport = [
    {
      name: "Uber",
      location: "All",
      tags: ["ride-hailing", "convenient", "safe"],
      rating: 4.5,
      metadata: {
        type: "Ride-hailing",
        average_cost: "₹15-30 per km",
        availability: "24/7",
        app_based: true,
      },
    },
    {
      name: "Ola Cabs",
      location: "All",
      tags: ["ride-hailing", "affordable", "local"],
      rating: 4.3,
      metadata: {
        type: "Ride-hailing",
        average_cost: "₹12-25 per km",
        availability: "24/7",
        app_based: true,
      },
    },
    {
      name: "Scooter Rental",
      location: "Baga, Anjuna",
      tags: ["rental", "explore", "flexible"],
      rating: 4.2,
      metadata: {
        type: "Two-wheeler",
        daily_cost: "₹200-400",
        requires: "International driving permit",
      },
    },
    {
      name: "Local Taxi",
      location: "All",
      tags: ["traditional", "negotiable", "local"],
      rating: 4.0,
      metadata: {
        type: "Taxi",
        average_cost: "₹20-40 per km",
        negotiable: true,
        no_meter: true,
      },
    },
  ];

  try {
    // Clear existing venues
    await prisma.localVenue.deleteMany({});
    console.log("✓ Cleared existing venues");

    // Insert restaurants
    for (const restaurant of restaurants) {
      await prisma.localVenue.create({
        data: {
          name: restaurant.name,
          type: VenueType.RESTAURANT,
          location: restaurant.location,
          tags: restaurant.tags,
          rating: restaurant.rating,
          phone: restaurant.phone,
          website: restaurant.website,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          metadata: restaurant.metadata,
        },
      });
    }
    console.log(`✓ Created ${restaurants.length} restaurants`);

    // Insert activities
    for (const activity of activities) {
      await prisma.localVenue.create({
        data: {
          name: activity.name,
          type: VenueType.ACTIVITY,
          location: activity.location,
          tags: activity.tags,
          rating: activity.rating,
          metadata: activity.metadata,
        },
      });
    }
    console.log(`✓ Created ${activities.length} activities`);

    // Insert transport
    for (const t of transport) {
      await prisma.localVenue.create({
        data: {
          name: t.name,
          type: VenueType.TRANSPORT,
          location: t.location,
          tags: t.tags,
          rating: t.rating,
          metadata: t.metadata,
        },
      });
    }
    console.log(`✓ Created ${transport.length} transport options`);

    console.log("🌱 Seeding complete!");
  } catch (error) {
    console.error("Error seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
