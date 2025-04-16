import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Parse the request body
    const { inputs } = await request.json();
    
    // Make sure the OpenRouter API key is properly set
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a helpful language tutor for level.
    - Respond primarily in  with English translations when appropriate.
    - Adjust your language complexity to match level.
    - Provide gentle corrections for grammar or vocabulary mistakes.
    - Be encouraging and supportive.
    - For beginner levels, use simple sentences and basic vocabulary.
    - For intermediate levels, introduce more complex grammar and vocabulary.
    - For advanced levels, use natural, native-like language.
    - When the user makes a mistake, provide the correction in [brackets].
    - Each response should end with a question to keep the conversation going.`;
    

    console.log("Sending request to OpenRouter with API key length:", apiKey.length);
    
    // Call OpenRouter API with the DeepSeek model
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000" // Required by OpenRouter
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: inputs }
          ],
      })
    });

    console.log("Ap",response)

    // Parse the response
    const result = await response.json();
    
    // Handle errors
    if (!response.ok) {
      console.error("OpenRouter API error details:", result);
      return NextResponse.json(
        { error: result.error?.message || "DeepSeek API error" },
        { status: response.status }
      );
    }

    // Return the successful result
    return NextResponse.json(result);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}