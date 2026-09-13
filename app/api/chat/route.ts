import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { chat, ChatMessage } from "@/lib/chat-agent";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, tripId, conversationHistory = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get chat response from agent
    const response = await chat(message, conversationHistory);

    // Note: Conversation history saving to database is skipped
    // (database tables don't exist yet - will be available after migration)
    // For now, client-side maintains conversation history

    return NextResponse.json({
      message: response.message,
      tools_used: response.tools_used,
      intent: response.intent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from chatbot" },
      { status: 500 }
    );
  }
}
