import { NextRequest, NextResponse } from "next/server";
import { withRequestControl } from "@/lib/requestControl";
import { auth } from "@/auth";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://ollama:11434";
const API_USERNAME = process.env.API_USERNAME || "admin";
const API_PASSWORD = process.env.API_PASSWORD || "password";

function basicAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return false;
  }

  const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString();
  const [username, password] = auth.split(":");

  return username === API_USERNAME && password === API_PASSWORD;
}

async function callOllama(
  prompt: string,
  model: string = "llama2"
): Promise<{ response: string }> {
  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return { response: data.response };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Basic auth check
  if (!basicAuth(req)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  try {
    // Get session for authenticated user detection
    const session = await auth();
    const isAuthenticated = !!session?.user;
    const userId = session?.user?.id;

    // Use request control wrapper
    return await withRequestControl(
      req,
      async (prompt: string, model?: string) => {
        const result = await callOllama(prompt, model);
        return result.response;
      },
      {
        isAuthenticated,
        userId,
      }
    );
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
