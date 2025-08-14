import { NextRequest, NextResponse } from "next/server";

// ==== CONFIG ====
const AUTH_MAX_REQUESTS_PER_HOUR = parseInt(
  process.env.AUTH_MAX_REQUESTS_PER_HOUR || "5"
);
const AUTH_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ==== RATE LIMIT STORE (in-memory) ====
interface AuthRateEntry {
  count: number;
  lastReset: number;
}

type AuthRateStore = Record<string, AuthRateEntry>;
const authRateStore: AuthRateStore = {};

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown";
  return ip;
}

function checkAuthRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = authRateStore[identifier] || { count: 0, lastReset: now };

  if (now - entry.lastReset > AUTH_WINDOW_MS) {
    entry.count = 0;
    entry.lastReset = now;
  }

  entry.count++;
  authRateStore[identifier] = entry;

  return entry.count <= AUTH_MAX_REQUESTS_PER_HOUR;
}

export function withAuthRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const identifier = getClientIdentifier(req);

    if (!checkAuthRateLimit(identifier)) {
      const resetTime = Math.ceil(
        (AUTH_WINDOW_MS - (Date.now() % AUTH_WINDOW_MS)) / 1000
      );

      console.log(
        `[${new Date().toISOString()}] Auth rate limit exceeded for ${identifier}`
      );

      return NextResponse.json(
        {
          error: "Too many authentication attempts. Please try again later.",
          resetIn: resetTime,
          limit: AUTH_MAX_REQUESTS_PER_HOUR,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": AUTH_MAX_REQUESTS_PER_HOUR.toString(),
            "X-RateLimit-Reset": (Date.now() + resetTime * 1000).toString(),
            "Retry-After": resetTime.toString(),
          },
        }
      );
    }

    return handler(req);
  };
}
