import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Lazy singletons — created on the first real HTTP request, never at build time.
// next build evaluates server modules during "Collecting page data", but env vars
// for external services are only meaningful at runtime. Lazy init avoids the
// UrlError that would crash the build phase.
// ---------------------------------------------------------------------------

let _redis: Redis | null | undefined;
let _chatLimiter: Ratelimit | null | undefined;
let _widgetLeadLimiter: Ratelimit | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return (_redis = null);
  try {
    return (_redis = new Redis({ url, token }));
  } catch (err) {
    console.error("[api-guard] Redis init failed, rate limiting disabled:", err);
    return (_redis = null);
  }
}

function getChatLimiter(): Ratelimit | null {
  if (_chatLimiter !== undefined) return _chatLimiter;
  const redis = getRedis();
  if (!redis) return (_chatLimiter = null);
  return (_chatLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:chat",
  }));
}

function getWidgetLeadLimiter(): Ratelimit | null {
  if (_widgetLeadLimiter !== undefined) return _widgetLeadLimiter;
  const redis = getRedis();
  if (!redis) return (_widgetLeadLimiter = null);
  return (_widgetLeadLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "rl:widget-lead",
  }));
}

// ---------------------------------------------------------------------------
// Allowed origins — update if a custom domain is added.
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  "https://lcodonto.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

// Layer 1: origin check — filters casual abuse and automated scanners.
// NOT a strong security boundary; a determined attacker can forge Origin/Referer.
// Real protection is the rate limiter below.
function isOriginAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  return ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
}

// On Vercel, x-forwarded-for is set by the infrastructure, not the client.
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
}

// ---------------------------------------------------------------------------
// guardRequest — call at the top of each protected route handler.
// Returns a NextResponse (403 or 429) to short-circuit, or null to proceed.
// ---------------------------------------------------------------------------

export async function guardRequest(
  req: NextRequest,
  route: "chat" | "widget-lead"
): Promise<NextResponse | null> {
  // Layer 1: origin
  if (!isOriginAllowed(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Layer 2: rate limit by IP (skipped if Redis not configured or unavailable)
  const limiter = route === "chat" ? getChatLimiter() : getWidgetLeadLimiter();
  if (limiter) {
    const ip = getClientIp(req);
    try {
      const { success } = await limiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Muitas requisições. Tente novamente em instantes." },
          { status: 429 }
        );
      }
    } catch (err) {
      // Fail open: a Redis outage should not break the user experience
      console.error("[api-guard] Redis unavailable, failing open:", err);
    }
  }

  return null;
}
