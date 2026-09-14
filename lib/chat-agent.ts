import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "./prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  tools_used: string[];
  intent: string;
}

// Tool definitions for the agent
const tools = {
  search_restaurants: {
    description: "Search for restaurants in Goa by location, cuisine, or vibe",
    params: {
      location: "Goa area (e.g., Baga, Anjuna, Palolem)",
      cuisine_or_vibe: "Cuisine type or vibe (e.g., seafood, casual, romantic)",
      max_results: "Maximum number of results (default: 5)",
    },
  },
  search_activities: {
    description: "Search for activities and attractions in Goa",
    params: {
      location: "Goa area",
      activity_type: "Type of activity (e.g., beach, trekking, culture, shopping)",
      max_results: "Maximum number of results (default: 5)",
    },
  },
  check_weather: {
    description: "Get weather information for the trip",
    params: {
      date: "Date to check weather (e.g., tomorrow, 2024-12-25)",
    },
  },
  get_directions: {
    description: "Get directions between two locations in Goa",
    params: {
      from_location: "Starting point",
      to_location: "Destination",
    },
  },
  get_tips: {
    description: "Get travel tips and local advice for Goa",
    params: {
      topic: "Topic for tips (e.g., safety, transportation, food, culture)",
    },
  },
};

// System prompt for the agent
const SYSTEM_PROMPT = `You are an AI Trip Concierge assistant for Goa, India. Your job is to help travelers plan their activities, find restaurants, get local advice, and answer questions about their trip.

You have access to the following tools:
${Object.entries(tools)
  .map(
    ([name, tool]) =>
      `- ${name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.params)}`
  )
  .join("\n")}

When answering user queries:
1. Identify the user's intent (search_restaurant, search_activity, get_directions, check_weather, get_tips, general_info)
2. If you need information from tools, mention which tools you would use
3. Provide helpful, concise responses with specific recommendations when possible
4. Always be friendly and offer follow-up suggestions
5. When you don't have exact information, acknowledge it and provide general advice

Format your responses naturally, and if tool results were available, integrate them seamlessly into your answer.`;

export async function classifyUserIntent(
  userMessage: string
): Promise<{
  intent: string;
  tools_needed: string[];
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `Classify this user message into one of these intents:
- search_restaurant: User wants to find a restaurant
- search_activity: User wants to find activities or attractions
- get_directions: User wants directions or travel info
- check_weather: User wants to know about weather
- get_tips: User wants travel tips and local advice
- general_info: General conversation or information

Also identify which tools would be needed to best answer this query.

User message: "${userMessage}"

Respond in JSON format:
{
  "intent": "...",
  "tools_needed": ["..."],
  "confidence": 0.0-1.0
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse intent classification:", e);
  }

  return {
    intent: "general_info",
    tools_needed: [],
  };
}

export async function executeToolCall(
  toolName: string,
  params: Record<string, string>
): Promise<string> {
  switch (toolName) {
    case "search_restaurants":
      return await searchRestaurants({
        location: params.location || "",
        cuisine_or_vibe: params.cuisine_or_vibe,
        max_results: params.max_results,
      });

    case "search_activities":
      return await searchActivities({
        location: params.location,
        activity_type: params.activity_type,
        max_results: params.max_results,
      });

    case "get_tips":
      return getTips(params.topic || "general");

    case "check_weather":
      return checkWeather(params.date || "today");

    case "get_directions":
      return getDirections(
        params.from_location || "",
        params.to_location || ""
      );

    default:
      return "Tool not found";
  }
}

async function searchRestaurants(params: {
  location: string;
  cuisine_or_vibe?: string;
  max_results?: string;
}): Promise<string> {
  try {
    const maxResults = parseInt(params.max_results || "5", 10);

    // Try to query from database
    try {
      const restaurants = await prisma.localVenue.findMany({
        where: {
          type: "RESTAURANT",
          location: {
            contains: params.location,
            mode: "insensitive",
          },
        },
        take: maxResults,
      });

      if (restaurants.length > 0) {
        const formatted = restaurants
          .map(
            (r) =>
              `• ${r.name} (${r.rating}/5)\n  Location: ${r.location}\n  Tags: ${r.tags.join(", ")}`
          )
          .join("\n\n");

        return `Found ${restaurants.length} restaurants:\n\n${formatted}`;
      }
    } catch (dbError) {
      console.warn("Database not available, using fallback data");
    }

    // Fallback recommendations
    const fallbacks: Record<string, string> = {
      Baga: "Popular in Baga: Thalassa (Greek seafood, upscale), Pepper's Shack (casual seafood, budget-friendly)",
      Anjuna:
        "Popular in Anjuna: Cavala (seafood with ocean view), Little Italy (pasta & pizza)",
      Palolem:
        "Popular in Palolem: The Fishery (upscale seafood), Magic Italy (beachside dining)",
      "South Goa":
        "Popular in South Goa: Local shacks along beaches, traditional Goan cuisine",
      "North Goa":
        "Popular in North Goa: Beach clubs, international restaurants, seafood specialists",
      Panjim:
        "Popular in Panjim: Local restaurants, Portuguese-influenced cuisine, cultural dining",
    };

    return (
      fallbacks[params.location] ||
      "Try local beachside shacks or ask locals for recommendations"
    );
  } catch (error) {
    console.error("Error searching restaurants:", error);
    return "I recommend trying local beachside restaurants or asking your hotel staff for recommendations.";
  }
}

async function searchActivities(params: {
  location?: string;
  activity_type?: string;
  max_results?: string;
}): Promise<string> {
  try {
    // Try to query from database
    try {
      const maxResults = parseInt(params.max_results || "5", 10);

      const activities = await prisma.localVenue.findMany({
        where: {
          type: "ACTIVITY",
          ...(params.location && {
            location: {
              contains: params.location,
              mode: "insensitive",
            },
          }),
          ...(params.activity_type && {
            tags: {
              has: params.activity_type.toLowerCase(),
            },
          }),
        },
        take: maxResults,
      });

      if (activities.length > 0) {
        const formatted = activities
          .map(
            (a) =>
              `• ${a.name} (${a.rating}/5)\n  Location: ${a.location}\n  Tags: ${a.tags.join(", ")}`
          )
          .join("\n\n");

        return `Found ${activities.length} activities:\n\n${formatted}`;
      }
    } catch (dbError) {
      console.warn("Database not available, using fallback data");
    }

    // Fallback recommendations
    const fallbacks: Record<string, string> = {
      beach: "Popular beach activities: Swimming, jet ski, parasailing, sunset watching",
      trekking:
        "Popular treks: Dudhsagar Waterfalls (moderate, 4+ hours), local forest trails",
      culture:
        "Cultural experiences: Old Goa churches, Portuguese architecture, local markets, spice plantations",
      shopping:
        "Shopping: Anjuna Flea Market (Wednesdays), local craft shops, beach shacks",
      "water-sports":
        "Water sports: Jet ski, parasailing, windsurfing, kayaking available at most beaches",
    };

    if (params.activity_type) {
      return (
        fallbacks[params.activity_type.toLowerCase()] ||
        "Contact your hotel for activity recommendations"
      );
    }

    return "Popular activities: Beach time, water sports, cultural sites, trekking, local markets, yoga & wellness";
  } catch (error) {
    console.error("Error searching activities:", error);
    return "Ask your hotel concierge or local tour operators for activity recommendations.";
  }
}

function getTips(topic: string): string {
  const tips: Record<string, string> = {
    safety:
      "Goa is generally safe for tourists. Use registered taxis or Uber, avoid deserted areas at night, and keep valuables secure.",
    transportation:
      "Use Uber/Ola for reliable transport. Scooter rentals available for ₹200-400/day. Local taxis are negotiable but often overcharge tourists.",
    food:
      "Try seafood curries and coconut-based dishes. Always eat where locals eat for authentic food. Drink bottled water and avoid ice.",
    culture:
      "Respect local customs, dress modestly in temples, and ask before photographing locals. Portuguese influence is visible in architecture.",
    money: "ATMs are widely available in Panaji and tourist areas. Cash is useful in smaller shops. Rupee is the currency.",
    nightlife:
      "Baga and Anjuna have beach parties. Opening times vary seasonally. Book scooters/taxis to return to your hotel safely.",
    best_time:
      "October-May is ideal. November-February is peak season. Monsoon (June-September) is offseason but stunning for nature lovers.",
    general:
      "Goa is a mix of beaches, culture, and adventure. Start early to beat crowds. Hire a local guide for hidden gems.",
  };

  return (
    tips[topic.toLowerCase()] ||
    tips["general"] +
      ` Use topics: ${Object.keys(tips).join(", ")}`
  );
}

function checkWeather(date: string): string {
  // Simplified mock weather - in production, integrate with weather API
  return `For ${date} in Goa: Check a weather service like Weather.com or AccuWeather for current forecasts. Generally: Nov-Feb is dry & pleasant (25-32°C), monsoon (Jun-Sep) is hot & humid.`;
}

function getDirections(from: string, to: string): string {
  // Simplified - in production, use Google Maps API
  return `Directions from ${from} to ${to}: Use Google Maps or your navigation app for turn-by-turn directions. Most locations in Goa are 30-60 minutes apart by car/scooter.`;
}

export async function chat(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    // Classify intent
    const { intent, tools_needed } = await classifyUserIntent(userMessage);
    console.log(`📌 Intent: ${intent}, Tools needed: ${tools_needed.join(", ")}`);

    // Prepare conversation context
    const messages = [
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    // Execute tool calls if needed
    let toolResults: Record<string, string> = {};
    for (const tool of tools_needed) {
      try {
        // Extract parameters from user message based on tool type
        let params: Record<string, string> = {};

        if (tool === "search_restaurants") {
          // Extract location from message (simple heuristic)
          const locationMatch = userMessage.match(
            /(?:restaurant|food|eat|dining).*(?:in|at|near)\s+(\w+)/i
          );
          params.location = locationMatch ? locationMatch[1] : "Goa";
        } else if (tool === "search_activities") {
          const locationMatch = userMessage.match(/(?:in|at|near)\s+(\w+)/i);
          params.location = locationMatch ? locationMatch[1] : "Goa";
        }

        const result = await executeToolCall(tool, params);
        toolResults[tool] = result;
        console.log(`✅ Tool ${tool} result: ${result.substring(0, 100)}...`);
      } catch (toolError) {
        console.error(`Error executing tool ${tool}:`, toolError);
        toolResults[tool] = "Unable to fetch results";
      }
    }

    // Build prompt with tool results
    let fullPrompt = SYSTEM_PROMPT + "\n\n";

    if (Object.keys(toolResults).length > 0) {
      fullPrompt +=
        "Tool results available:\n" +
        Object.entries(toolResults)
          .map(([tool, result]) => `${tool}: ${result}`)
          .join("\n\n") +
        "\n\n";
    }

    fullPrompt += `Previous conversation (last 4 messages):\n${messages
      .slice(-4)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")}\n\nRespond naturally and helpfully. Do NOT use markdown formatting like **, *, or other symbols. Keep your response plain text and concise (under 150 characters for WhatsApp).`;

    const response = await model.generateContent(fullPrompt);
    let assistantMessage = response.response.text();

    // Clean up markdown formatting from response
    assistantMessage = assistantMessage
      .replace(/\*\*/g, "") // Remove **
      .replace(/\*(?!\s)/g, "") // Remove * that aren't spaces
      .replace(/### /g, "") // Remove markdown headers
      .replace(/## /g, "")
      .replace(/# /g, "")
      .replace(/`/g, "") // Remove backticks
      .replace(/\n/g, " ") // Convert newlines to spaces for WhatsApp
      .trim();

    console.log(`💬 Generated response: "${assistantMessage}"`);

    return {
      message: assistantMessage,
      tools_used: tools_needed,
      intent,
    };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      message:
        "I apologize, but I encountered an error. Please try again or contact support.",
      tools_used: [],
      intent: "error",
    };
  }
}
