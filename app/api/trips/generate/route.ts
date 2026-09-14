import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface GenerateItineraryRequest {
  booking_id?: string;
  property_id?: string;
  property_name?: string;
  property_location: string; // e.g., "Baga", "Anjuna", "Palolem"
  check_in: string; // ISO date: 2024-12-20
  check_out: string; // ISO date: 2024-12-25
  preferences?: {
    cuisine_preferences?: string[];
    activity_types?: string[];
    budget_range?: string;
    interests?: string[];
  };
}

interface ItineraryDay {
  date: string;
  theme: string;
  activities: Array<{
    time: string;
    title: string;
    location: string;
    duration_mins: number;
  }>;
  meals: Array<{
    meal: "breakfast" | "lunch" | "dinner";
    restaurant?: string;
    cuisine?: string;
    tips?: string;
  }>;
  evening_tip?: string;
}

interface GeneratedItinerary {
  property_location: string;
  check_in: string;
  check_out: string;
  days: ItineraryDay[];
  general_tips: string[];
  packing_suggestions: string[];
  budget_estimate?: string;
}

async function getLocalVenueContext(location: string): Promise<string> {
  try {
    // Get top restaurants and activities for the location
    const venues = await prisma.localVenue.findMany({
      where: {
        location: {
          contains: location,
          mode: "insensitive",
        },
      },
      take: 10,
    });

    if (venues.length === 0) {
      return "No specific venues available in database for this location. Use general recommendations for Goa.";
    }

    return venues
      .map(
        (v) =>
          `${v.name} (${v.type}): ${v.tags.join(", ")} - Rating: ${v.rating || "N/A"}`
      )
      .join("\n");
  } catch (error) {
    console.error("Error fetching venue context:", error);
    // Gracefully handle missing database tables
    return "Using default Goa venue recommendations (database not yet initialized).";
  }
}

async function generateItinerary(
  request: GenerateItineraryRequest
): Promise<GeneratedItinerary> {
  // Check cache first
  const cacheKey = `itinerary:${request.property_location}:${request.check_in}:${request.check_out}`;
  let cached: string | null = null;
  try {
    cached = await redis.get(cacheKey);
  } catch (error) {
    // Caching is an optimization. Do not fail itinerary generation when Redis
    // is unavailable in a serverless runtime.
    console.warn("Redis cache read failed; generating itinerary without cache:", error);
  }

  if (cached) {
    console.log("✓ Returning cached itinerary");
    return JSON.parse(cached);
  }

  // Get local venue context
  const venueContext = await getLocalVenueContext(request.property_location);

  // Calculate number of days
  const checkInDate = new Date(request.check_in);
  const checkOutDate = new Date(request.check_out);
  const days = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Build prompt
  const prompt = `You are a travel concierge for Goa, India. Generate a detailed, day-by-day itinerary.

TRIP DETAILS:
- Location: ${request.property_location}
- Check-in: ${request.check_in}
- Check-out: ${request.check_out}
- Duration: ${days} days
- Preferences: ${JSON.stringify(request.preferences || {})}

AVAILABLE VENUES IN AREA:
${venueContext}

Generate a JSON itinerary with the following structure. Be VERY specific with times, locations, and restaurant names. Include realistic travel times.

Format:
{
  "property_location": "${request.property_location}",
  "check_in": "${request.check_in}",
  "check_out": "${request.check_out}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "theme": "Theme for the day (e.g., Beach & Sunset)",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "location": "Specific location in Goa",
          "duration_mins": 120
        }
      ],
      "meals": [
        {
          "meal": "breakfast|lunch|dinner",
          "restaurant": "Specific restaurant name if known from context",
          "cuisine": "Cuisine type",
          "tips": "Why this restaurant or local tip"
        }
      ],
      "evening_tip": "Evening activity or relaxation suggestion"
    }
  ],
  "general_tips": ["tip1", "tip2", "tip3"],
  "packing_suggestions": ["item1", "item2"],
  "budget_estimate": "Estimated daily budget in INR"
}

IMPORTANT:
- Each day should have 3-4 activities
- Include realistic travel times between locations
- Mix culture, nature, food, and relaxation
- Use real venue names from the context when available
- Respect guest preferences
- Make it engaging and actionable`;

  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse itinerary from LLM response");
  }

  const itinerary = JSON.parse(jsonMatch[0]) as GeneratedItinerary;

  // Cache for 24 hours, without making Redis availability user-facing.
  try {
    await redis.setex(cacheKey, 86400, JSON.stringify(itinerary));
  } catch (error) {
    console.warn("Redis cache write failed; returning uncached itinerary:", error);
  }

  return itinerary;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as GenerateItineraryRequest;

    // Validate required fields
    if (
      !body.property_location ||
      !body.check_in ||
      !body.check_out
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: property_location, check_in, check_out",
        },
        { status: 400 }
      );
    }

    // Generate itinerary
    const itinerary = await generateItinerary(body);

    // Try to save to database, but don't fail if it fails
    try {
      const tripConcierge = await prisma.tripConcierge.create({
        data: {
          user_id: userId,
          booking_id: body.booking_id,
          property_id: body.property_id,
          property_name: body.property_name,
          property_location: body.property_location,
          check_in: new Date(body.check_in),
          check_out: new Date(body.check_out),
          itinerary: itinerary as any,
          preferences: body.preferences as any,
        },
      });

      return NextResponse.json({
        trip_id: tripConcierge.id,
        itinerary,
        message: "Itinerary generated successfully",
      });
    } catch (dbError) {
      console.warn("Could not save to database (may be migrating), returning itinerary only:", dbError);
      // Still return the generated itinerary even if database save fails
      return NextResponse.json({
        trip_id: `temp_${Date.now()}`,
        itinerary,
        message: "Itinerary generated successfully (not persisted - database may need migration)",
      });
    }
  } catch (error) {
    console.error("Itinerary generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate itinerary" },
      { status: 500 }
    );
  }
}
