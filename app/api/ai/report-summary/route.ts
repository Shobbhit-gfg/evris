import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("🟢 API ROUTE HIT: /api/ai/report-summary");

    // 1. Check for API Key immediately
    if (!process.env.GEMINI_API_KEY) {
      console.error("🔴 ERROR: GEMINI_API_KEY is missing in .env.local");
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // 2. Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // 3. Parse the frontend data
    const { reports } = await req.json();
    console.log(`🟢 Received ${reports?.length || 0} reports from frontend.`);

    const prompt = `
Analyze these EVRIS user reports.
Reports:${JSON.stringify(reports)}
Return:
1. Total reports
2. Most common category
3. Main issues
4. Recommended actions
5. Short executive summary
Keep it concise.
`;

    // 4. Call Gemini with valid model
    console.log("🟢 Calling Gemini API...");
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    console.log("🟢 Gemini generation successful!");
    return NextResponse.json({ summary: result.text });

  } catch (error) {
    // 5. Catch ALL errors and force them into JSON format
    console.error("🔴 SERVER CRASHED:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown backend error" },
      { status: 500 }
    );
  }
}