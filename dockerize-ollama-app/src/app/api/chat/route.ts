import { NextRequest, NextResponse } from "next/server";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://ollama:11434";
const API_USERNAME = process.env.API_USERNAME || "admin";
const API_PASSWORD = process.env.API_PASSWORD || "password";

function basicAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return false;
  }

  const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString();
  const [username, password] = auth.split(":");

  return username === API_USERNAME && password === API_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!basicAuth(req)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  try {
    const { question, model = "llama2" } = await req.json();

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: question,
        stream: false,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ response: data.response });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
