import { NextRequest, NextResponse } from "next/server";

// ==== CONFIG ====
const MAX_REQUESTS_PER_MINUTE = parseInt(
  process.env.MAX_REQUESTS_PER_MINUTE || "10"
);
const MAX_REQUESTS_PER_MINUTE_AUTH = parseInt(
  process.env.MAX_REQUESTS_PER_MINUTE_AUTH || "20"
);
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || "300000"); // 5 min default
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || "200");

// ==== RATE LIMIT STORE (in-memory) ====
interface RateEntry {
  count: number;
  lastReset: number;
}

type RateStore = Record<string, RateEntry>;
const rateStore: RateStore = {};

// ==== CACHE STORE (in-memory) ====
interface CacheEntry {
  value: unknown;
  expires: number;
}

const cacheStore = new Map<string, CacheEntry>();

// ==== RATE LIMIT FUNCTION ====
function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean = false
): boolean {
  const now = Date.now();
  const entry = rateStore[identifier] || { count: 0, lastReset: now };

  if (now - entry.lastReset > 60_000) {
    entry.count = 0;
    entry.lastReset = now;
  }

  entry.count++;
  rateStore[identifier] = entry;

  const limit = isAuthenticated
    ? MAX_REQUESTS_PER_MINUTE_AUTH
    : MAX_REQUESTS_PER_MINUTE;
  return entry.count <= limit;
}

// ==== CACHE FUNCTIONS ====
function getCached(key: string): unknown | null {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cacheStore.delete(key);
    return null;
  }
  return item.value;
}

function setCached(key: string, value: unknown): void {
  cacheStore.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

// ==== UTILITY FUNCTIONS ====
function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown";
  return ip;
}

function createCacheKey(prompt: string, model?: string): string {
  const baseKey = prompt.toLowerCase().trim();
  return model ? `${model}:${baseKey}` : baseKey;
}

function logUsage(
  identifier: string,
  prompt: string,
  cached: boolean,
  isAuth: boolean
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${identifier} | Auth: ${isAuth} | Cached: ${cached} | Prompt: ${prompt.substring(
      0,
      50
    )}...`
  );
}

// ==== STREAM CUTTER ====
async function* streamWithCutoff(
  stream: AsyncGenerator<string>,
  maxTokens: number
): AsyncGenerator<string> {
  let tokens = 0;
  for await (const chunk of stream) {
    const chunkTokens = chunk.split(/\s+/).filter(Boolean).length;
    if (tokens + chunkTokens > maxTokens) {
      // Send partial chunk if we're close to limit
      const remainingTokens = maxTokens - tokens;
      if (remainingTokens > 0) {
        const words = chunk.split(/\s+/).filter(Boolean);
        yield words.slice(0, remainingTokens).join(" ");
      }
      break;
    }
    tokens += chunkTokens;
    yield chunk;
  }
}

// ==== MAIN HANDLER WRAPPER ====
export async function withRequestControl(
  req: NextRequest,
  handler: (prompt: string, model?: string) => Promise<unknown>,
  options?: { isAuthenticated?: boolean; userId?: string }
): Promise<NextResponse> {
  try {
    const identifier = getClientIdentifier(req);
    const isAuthenticated = options?.isAuthenticated || false;
    const userId = options?.userId;

    // Use userId for authenticated users, IP for anonymous
    const rateLimitKey = userId || identifier;

    // Check rate limit
    if (!checkRateLimit(rateLimitKey, isAuthenticated)) {
      const resetTime = Math.ceil((60_000 - (Date.now() % 60_000)) / 1000);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          resetIn: resetTime,
          limit: isAuthenticated
            ? MAX_REQUESTS_PER_MINUTE_AUTH
            : MAX_REQUESTS_PER_MINUTE,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": (isAuthenticated
              ? MAX_REQUESTS_PER_MINUTE_AUTH
              : MAX_REQUESTS_PER_MINUTE
            ).toString(),
            "X-RateLimit-Reset": (Date.now() + resetTime * 1000).toString(),
            "Retry-After": resetTime.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { prompt, question, model = "llama2" } = body;
    const actualPrompt = prompt || question;

    if (!actualPrompt || actualPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = createCacheKey(actualPrompt, model);

    // Try cache first
    const cached = getCached(cacheKey);
    if (cached) {
      logUsage(rateLimitKey, actualPrompt, true, isAuthenticated);
      return NextResponse.json(
        {
          cached: true,
          response: cached,
        },
        {
          headers: {
            "X-Cache": "HIT",
            "X-Cache-Key": cacheKey,
          },
        }
      );
    }

    // Call handler
    const result = await handler(actualPrompt, model);

    // Handle streaming responses
    if (
      result &&
      typeof result === "object" &&
      result !== null &&
      Symbol.asyncIterator in result
    ) {
      const limitedStream = streamWithCutoff(
        result as AsyncGenerator<string>,
        MAX_TOKENS
      );

      // Convert async generator to ReadableStream for Next.js
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of limitedStream) {
              controller.enqueue(new TextEncoder().encode(chunk));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      logUsage(rateLimitKey, actualPrompt, false, isAuthenticated);
      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Cache": "MISS",
          "X-Streaming": "true",
        },
      });
    }

    // Cache result if reasonable size
    const resultSize = JSON.stringify(result).length;
    if (resultSize < 100_000) {
      setCached(cacheKey, result);
    }

    logUsage(rateLimitKey, actualPrompt, false, isAuthenticated);
    return NextResponse.json(
      {
        cached: false,
        response: result,
      },
      {
        headers: {
          "X-Cache": "MISS",
          "X-Cache-Key": cacheKey,
          "X-Response-Size": resultSize.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Request control error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
