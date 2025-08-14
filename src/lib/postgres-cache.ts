/**
 * PostgreSQL-based caching using Prisma
 * Stores cache entries in your existing Fly.io Postgres database
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// You'll need to add this to your Prisma schema:
/*
model CacheEntry {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([expiresAt])
}
*/

export class PostgresCache {
  private prefix: string;
  private defaultTtlMs: number;

  constructor(prefix: string = "cache", defaultTtlMs: number = 300000) {
    this.prefix = prefix;
    this.defaultTtlMs = defaultTtlMs;
  }

  private createKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get(key: string): Promise<unknown | null> {
    // TODO: Uncomment when CacheEntry model is added to Prisma schema
    /*
    try {
      const cacheKey = this.createKey(key);
      
      // First, clean up expired entries
      await this.cleanup();

      const entry = await prisma.cacheEntry.findUnique({
        where: { key: cacheKey }
      });

      if (!entry) return null;

      // Check if expired
      if (entry.expiresAt < new Date()) {
        await prisma.cacheEntry.delete({
          where: { key: cacheKey }
        });
        return null;
      }

      return JSON.parse(entry.value);
    } catch (error) {
      console.error('Postgres cache get error:', error);
      return null;
    }
    */

    // Placeholder return until model is implemented
    return null;
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    // TODO: Uncomment when CacheEntry model is added
    /*
    try {
      const cacheKey = this.createKey(key);
      const ttl = ttlMs || this.defaultTtlMs;
      const expiresAt = new Date(Date.now() + ttl);
      const serializedValue = JSON.stringify(value);

      await prisma.cacheEntry.upsert({
        where: { key: cacheKey },
        update: {
          value: serializedValue,
          expiresAt,
        },
        create: {
          key: cacheKey,
          value: serializedValue,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Postgres cache set error:', error);
    }
    */
  }

  async delete(key: string): Promise<void> {
    // TODO: Uncomment when CacheEntry model is added
    /*
    try {
      const cacheKey = this.createKey(key);
      await prisma.cacheEntry.delete({
        where: { key: cacheKey }
      });
    } catch (error) {
      console.error('Postgres cache delete error:', error);
    }
    */
  }

  async clear(): Promise<void> {
    // TODO: Uncomment when CacheEntry model is added
    /*
    try {
      await prisma.cacheEntry.deleteMany({
        where: {
          key: {
            startsWith: `${this.prefix}:`
          }
        }
      });
    } catch (error) {
      console.error('Postgres cache clear error:', error);
    }
    */
  }

  async cleanup(): Promise<void> {
    // TODO: Uncomment when CacheEntry model is added
    /*
    try {
      // Delete expired entries
      await prisma.cacheEntry.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Postgres cache cleanup error:', error);
    }
    */
  }

  async getStats(): Promise<{ total: number; expired: number }> {
    // TODO: Uncomment when CacheEntry model is added
    /*
    try {
      const [total, expired] = await Promise.all([
        prisma.cacheEntry.count({
          where: {
            key: {
              startsWith: `${this.prefix}:`
            }
          }
        }),
        prisma.cacheEntry.count({
          where: {
            key: {
              startsWith: `${this.prefix}:`
            },
            expiresAt: {
              lt: new Date()
            }
          }
        })
      ]);

      return { total, expired };
    } catch (error) {
      console.error('Postgres cache stats error:', error);
      return { total: 0, expired: 0 };
    }
    */

    return { total: 0, expired: 0 };
  }
}

// Production instances
export const postgresQueryCache = new PostgresCache("query", 300000); // 5 minutes
export const postgresUserCache = new PostgresCache("user", 120000); // 2 minutes

/**
 * Setup Instructions:
 *
 * 1. Add the CacheEntry model to your prisma/schema.prisma:
 *
 * model CacheEntry {
 *   id        String   @id @default(cuid())
 *   key       String   @unique
 *   value     String   @db.Text
 *   expiresAt DateTime
 *   createdAt DateTime @default(now())
 *   updatedAt DateTime @updatedAt
 *
 *   @@index([expiresAt])
 * }
 *
 * 2. Run migration:
 *    npx prisma migrate dev --name add_cache_table
 *
 * 3. Use in your code:
 *    import { postgresQueryCache } from '@/lib/postgres-cache';
 *
 *    const cached = await postgresQueryCache.get('my-key');
 *    await postgresQueryCache.set('my-key', data, 300000);
 *
 * 4. Set up periodic cleanup (optional):
 *    Create a cron job or scheduled function to call cleanup()
 */
