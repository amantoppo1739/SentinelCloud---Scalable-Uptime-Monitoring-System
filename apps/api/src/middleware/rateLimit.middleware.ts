import rateLimit from 'express-rate-limit';
import { redis } from '../db/redis.js';
import env from '../config/env.js';

// Redis store for rate limiting (custom interface - express-rate-limit Store contract)
interface RateLimitStoreResult {
  totalHits: number;
  resetTime: Date;
}
interface RateLimitStore {
  increment(key: string): Promise<RateLimitStoreResult>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
  shutdown(): Promise<void>;
}

class RedisStore implements RateLimitStore {
  async increment(key: string): Promise<RateLimitStoreResult> {
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.pexpire(key, env.RATE_LIMIT_WINDOW_MS);
    }

    const ttl = await redis.pttl(key);
    
    return {
      totalHits: count,
      resetTime: new Date(Date.now() + ttl),
    };
  }

  async decrement(key: string): Promise<void> {
    await redis.decr(key);
  }

  async resetKey(key: string): Promise<void> {
    await redis.del(key);
  }

  async shutdown(): Promise<void> {
    // Redis connection is managed elsewhere
  }
}

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  store: new RedisStore(),
  keyGenerator: (req) => 'api:' + (req.ip || req.socket?.remoteAddress || 'unknown'),
  validate: { singleCount: false }, // we use two limiters (api + auth) with different keys; avoid false positive
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 min to avoid 429 during normal use
  store: new RedisStore(),
  keyGenerator: (req) => 'auth:' + (req.ip || req.socket?.remoteAddress || 'unknown'),
  validate: { singleCount: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.',
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 refresh requests per 15 min
  store: new RedisStore(),
  keyGenerator: (req) => 'refresh:' + (req.ip || req.socket?.remoteAddress || 'unknown'),
  validate: { singleCount: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many refresh requests, please try again later.',
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour
  store: new RedisStore(),
  keyGenerator: (req) => 'register:' + (req.ip || req.socket?.remoteAddress || 'unknown'),
  validate: { singleCount: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many registration attempts, please try again later.',
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  store: new RedisStore(),
  keyGenerator: (req) => {
    // Use email if available, otherwise IP
    const email = req.body?.email;
    return email ? `password-reset:${email}` : `password-reset:${req.ip || 'unknown'}`;
  },
  validate: { singleCount: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password reset requests, please try again later.',
});
