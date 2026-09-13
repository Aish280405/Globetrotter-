import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set in environment" },
        { status: 500 }
      );
    }

    console.log("Testing Gemini API with key:", apiKey.substring(0, 20) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const result = await model.generateContent("Say 'Hello from Gemini!'");
    const text = result.response.text();

    return NextResponse.json({
      status: "success",
      message: text,
      model_used: "gemini-1.5-flash",
      api_key_valid: true,
    });
  } catch (error) {
    console.error("Gemini API test error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "failed",
      },
      { status: 500 }
    );
  }
}
