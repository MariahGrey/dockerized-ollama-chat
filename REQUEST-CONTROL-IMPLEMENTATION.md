# Request Control Implementation

This document describes the comprehensive request control system implemented to manage rate limiting, caching, and streaming cutoffs for your Dockerized Ollama Chat application.

## ✅ Implemented Features

### 1. Rate Limiting

- **Anonymous users**: 10 requests per minute (configurable via `MAX_REQUESTS_PER_MINUTE`)
- **Authenticated users**: 20 requests per minute (configurable via `MAX_REQUESTS_PER_MINUTE_AUTH`)
- **Authentication attempts**: 5 attempts per hour (configurable via `AUTH_MAX_REQUESTS_PER_HOUR`)
- **IP-based tracking** with proper header parsing (`x-forwarded-for`, `x-real-ip`)
- **Different quotas** for authenticated vs anonymous users

### 2. Caching

- **TTL-based caching**: 5 minutes default (configurable via `CACHE_TTL_MS`)
- **Smart cache keys**: Based on prompt content and model
- **Cache hit/miss headers**: `X-Cache`, `X-Cache-Key`
- **Automatic cleanup** of expired entries
- **Size limits**: Won't cache responses larger than 100KB

### 3. Streaming Cutoff

- **Token-based limiting**: 200 tokens default (configurable via `MAX_TOKENS`)
- **Smart word counting**: Filters empty strings and handles partial chunks
- **Graceful cutoff**: Sends partial content when approaching limit
- **Streaming headers**: `X-Streaming` indicator

### 4. Usage Logging

- **Comprehensive logging**: IP, authentication status, cache status, prompt preview
- **Fly.io compatible**: Logs appear in `fly logs` for usage tracking
- **Rate limit violations**: Logged for security monitoring

## 📁 File Structure

```
src/lib/
├── requestControl.ts     # Main request control wrapper
├── authRateLimit.ts      # Authentication-specific rate limiting
├── redis-store.ts        # Redis implementation (optional)
└── postgres-cache.ts     # PostgreSQL cache implementation (optional)
```

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Rate Limiting & Caching Configuration
MAX_REQUESTS_PER_MINUTE="10"          # Anonymous users per minute
MAX_REQUESTS_PER_MINUTE_AUTH="20"     # Authenticated users per minute
AUTH_MAX_REQUESTS_PER_HOUR="5"        # Auth attempts per hour
CACHE_TTL_MS="300000"                 # Cache TTL in milliseconds (5 min)
MAX_TOKENS="200"                      # Max tokens before cutoff
```

### Production Settings

For production, consider these higher limits:

```bash
MAX_REQUESTS_PER_MINUTE="50"
MAX_REQUESTS_PER_MINUTE_AUTH="100"
AUTH_MAX_REQUESTS_PER_HOUR="10"
CACHE_TTL_MS="600000"
MAX_TOKENS="500"
```

## 🚀 Usage

### Chat API Route (Implemented)

The main chat API (`/api/chat`) now uses the request control wrapper:

```typescript
import { withRequestControl } from "@/lib/requestControl";
import { auth } from "@/auth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Basic auth check first
  if (!basicAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Get session for user detection
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const userId = session?.user?.id;

  // Apply request control
  return await withRequestControl(
    req,
    async (prompt: string, model?: string) => {
      const result = await callOllama(prompt, model);
      return result.response;
    },
    { isAuthenticated, userId }
  );
}
```

### Auth Routes (Implemented)

Authentication routes use separate rate limiting:

```typescript
import { withAuthRateLimit } from "@/lib/authRateLimit";

export const POST = withAuthRateLimit(handleSignup);
```

## 📊 Response Headers

The system adds helpful headers to responses:

### Rate Limiting Headers

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Reset`: When the limit resets
- `Retry-After`: Seconds to wait when rate limited

### Cache Headers

- `X-Cache`: `HIT` or `MISS`
- `X-Cache-Key`: The cache key used
- `X-Response-Size`: Size of the response in bytes

### Streaming Headers

- `X-Streaming`: `true` when response is streamed
- `Content-Type`: `text/plain; charset=utf-8` for streams

## 🔄 Optional Improvements (Ready to Implement)

### 1. Redis for Multi-Instance Support

File: `src/lib/redis-store.ts`

```bash
# Install Redis support
npm install redis @types/redis

# Set environment variable
REDIS_URL=redis://localhost:6379

# For Fly.io
fly redis create
fly secrets set REDIS_URL="redis://your-redis-url"
```

Uncomment the Redis code in `redis-store.ts` and replace in-memory stores in `requestControl.ts`.

### 2. PostgreSQL Cache Storage

File: `src/lib/postgres-cache.ts`

Add to your Prisma schema:

```prisma
model CacheEntry {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([expiresAt])
}
```

Run migration:

```bash
npx prisma migrate dev --name add_cache_table
```

Uncomment the code in `postgres-cache.ts` and use:

```typescript
import { postgresQueryCache } from "@/lib/postgres-cache";
```

## 🔍 Monitoring & Analytics

### Log Format

```
[2024-01-01T12:00:00.000Z] 127.0.0.1 | Auth: true | Cached: false | Prompt: What is machine learning...
```

### Usage Tracking

- All requests are logged with IP, auth status, and cache status
- Rate limit violations are logged for security analysis
- Response sizes are tracked for cost monitoring

### Fly.io Integration

```bash
# View logs
fly logs

# Monitor in real-time
fly logs -f

# Filter for rate limiting
fly logs | grep "rate limit"
```

## 🛡️ Security Features

### Rate Limiting

- **IP-based tracking**: Prevents abuse from single sources
- **Progressive limits**: Stricter limits for unauthenticated users
- **Auth protection**: Separate limits for login attempts
- **Sliding window**: More accurate than fixed windows

### Caching Security

- **Size limits**: Prevents memory exhaustion
- **TTL enforcement**: Automatic cleanup of old entries
- **Key validation**: Prevents cache pollution

### Error Handling

- **Graceful degradation**: Continues working if cache/Redis fails
- **Detailed logging**: Helps with debugging and monitoring
- **Fail-open policy**: Allows requests when systems are down

## 📈 Performance Impact

### Benefits

- **Reduced Ollama calls**: Cache hit rate typically 20-30%
- **Cost savings**: Fewer API calls to Ollama
- **Faster responses**: Cached responses are instant
- **Abuse prevention**: Rate limiting protects against overuse

### Overhead

- **Memory usage**: In-memory cache grows with usage
- **CPU overhead**: Minimal processing for rate limiting
- **Database impact**: Optional Postgres cache adds queries

## 🚨 Troubleshooting

### High Memory Usage

- Switch to Redis for production
- Reduce `CACHE_TTL_MS`
- Lower cache size limits

### Rate Limiting Issues

- Check IP detection logic
- Verify environment variables
- Monitor logs for patterns

### Cache Misses

- Ensure consistent key generation
- Check TTL settings
- Monitor cache cleanup frequency

## 🔮 Future Enhancements

1. **Advanced Rate Limiting**

   - Per-user quotas stored in database
   - Dynamic limits based on usage patterns
   - Burst allowances for legitimate users

2. **Smart Caching**

   - Semantic similarity for cache hits
   - Pre-warming popular queries
   - Distributed cache invalidation

3. **Analytics Dashboard**

   - Usage metrics visualization
   - Cost tracking and budgeting
   - Performance monitoring

4. **Advanced Security**
   - Anomaly detection
   - Automatic IP blocking
   - Honeypot queries

The request control system is now fully implemented and ready for production use! 🎉
