/**
 * Redis-based rate limiting and caching for production use
 *
 * Installation: npm install redis @types/redis
 *
 * Usage:
 * 1. Set REDIS_URL in your environment
 * 2. Uncomment the Redis imports and code below
 * 3. Replace the in-memory stores in requestControl.ts with Redis calls
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest } from "next/server";

// Uncomment these lines when you want to use Redis:
/*
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('Redis Client Error', err));

let isConnected = false;

// Initialize Redis connection
redis.connect().then(() => {
  isConnected = true;
  console.log('✅ Connected to Redis');
}).catch((error) => {
  console.error('❌ Redis connection failed:', error);
});

export { redis, isConnected };
*/

// ==== REDIS RATE LIMITING ====
export class RedisRateLimit {
  private prefix: string;
  private maxRequests: number;
  private windowMs: number;

  constructor(prefix: string, maxRequests: number, windowMs: number) {
    this.prefix = prefix;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(
    _identifier: string
  ): Promise<{ allowed: boolean; resetTime?: number }> {
    // TODO: Implement Redis-based rate limiting
    // Uncomment when Redis is available:
    /*
    if (!isConnected) {
      console.warn('Redis not connected, allowing request');
      return { allowed: true };
    }

    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Use Redis sorted sets for sliding window rate limiting
      const pipeline = redis.multi();
      
      // Remove old entries
      pipeline.zRemRangeByScore(key, 0, windowStart);
      
      // Add current request
      pipeline.zAdd(key, { score: now, value: now.toString() });
      
      // Count requests in window
      pipeline.zCard(key);
      
      // Set expiry
      pipeline.expire(key, Math.ceil(this.windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results[2] as number;
      
      const allowed = count <= this.maxRequests;
      const resetTime = allowed ? undefined : now + this.windowMs;
      
      return { allowed, resetTime };
      
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return { allowed: true }; // Fail open
    }
    */

    // Fallback to allowing request when Redis is not implemented
    console.warn("Redis rate limiting not implemented, allowing request");
    return { allowed: true };
  }
}

// ==== REDIS CACHING ====
export class RedisCache {
  private prefix: string;
  private defaultTtl: number;

  constructor(prefix: string, defaultTtl: number) {
    this.prefix = prefix;
    this.defaultTtl = defaultTtl;
  }

  async get(_key: string): Promise<unknown | null> {
    // TODO: Implement Redis caching
    // Uncomment when Redis is available:
    /*
    if (!isConnected) return null;

    try {
      const cached = await redis.get(`${this.prefix}:${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
    */

    return null; // No cache when Redis not implemented
  }

  async set(
    _key: string,
    _value: unknown,
    _ttlSeconds?: number
  ): Promise<void> {
    // TODO: Implement Redis caching
    // Uncomment when Redis is available:
    /*
    if (!isConnected) return;

    try {
      const ttl = ttlSeconds || Math.ceil(this.defaultTtl / 1000);
      await redis.setEx(`${this.prefix}:${key}`, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
    */
  }

  async delete(_key: string): Promise<void> {
    // TODO: Implement Redis deletion
    // Uncomment when Redis is available:
    /*
    if (!isConnected) return;

    try {
      await redis.del(`${this.prefix}:${key}`);
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
    */
  }

  async clear(): Promise<void> {
    // TODO: Implement Redis cache clearing
    // Uncomment when Redis is available:
    /*
    if (!isConnected) return;

    try {
      const keys = await redis.keys(`${this.prefix}:*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Redis cache clear error:', error);
    }
    */
  }
}

// ==== PRODUCTION INSTANCES ====
export const redisRateLimit = new RedisRateLimit("rate", 10, 60000);
export const redisAuthRateLimit = new RedisRateLimit("auth_rate", 5, 3600000);
export const redisQueryCache = new RedisCache("query", 300000);

// ==== UTILITY FUNCTIONS ====
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown";
  return ip;
}

/**
 * Instructions for enabling Redis:
 *
 * 1. Install Redis:
 *    npm install redis @types/redis
 *
 * 2. Add to your environment:
 *    REDIS_URL=redis://localhost:6379
 *
 * 3. For Fly.io deployment:
 *    fly redis create
 *    fly secrets set REDIS_URL="redis://your-redis-url"
 *
 * 4. Uncomment the Redis code in this file
 *
 * 5. Update requestControl.ts to use Redis stores:
 *    import { redisRateLimit, redisQueryCache } from './redis-store';
 *
 * 6. Replace in-memory operations with Redis calls
 */
