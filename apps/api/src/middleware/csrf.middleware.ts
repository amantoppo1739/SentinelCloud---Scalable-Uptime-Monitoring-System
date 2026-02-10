import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

// CSRF token secret from environment or generate one
const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

// Store CSRF tokens in memory (in production, use Redis)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < now) {
      csrfTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Get session identifier - use JWT user ID if authenticated, otherwise generate per-request token
function getSessionId(req: Request): string {
  // Try to extract user ID from JWT access token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ') && !authHeader.startsWith('Bearer sc_live_')) {
    const token = authHeader.substring(7);
    try {
      // Verify and decode JWT
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      if (payload.userId) {
        return `user_${payload.userId}`;
      }
    } catch (e) {
      // Invalid or expired JWT, fall through
      console.log('[CSRF] Invalid JWT, falling back to IP-based session');
    }
  }
  
  // Fallback to IP address for non-authenticated requests
  return req.ip || 'default';
}

export function generateCsrfToken(req: Request): string {
  const sessionId = getSessionId(req);
  
  // Check if a valid token already exists for this session
  const existing = csrfTokens.get(sessionId);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.token;
  }
  
  // Generate new token
  const token = crypto.randomBytes(32).toString('hex');
  
  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  console.log(`[CSRF] Generated token for session: ${sessionId}`);
  return token;
}

export function getCsrfToken(req: Request): string | null {
  const sessionId = getSessionId(req);
  const stored = csrfTokens.get(sessionId);
  
  if (!stored || stored.expiresAt < Date.now()) {
    return null;
  }
  
  return stored.token;
}

export function validateCsrfToken(req: Request): boolean {
  // Skip CSRF validation for API key authentication
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer sc_live_')) {
    return true;
  }

  const sessionId = getSessionId(req);
  const stored = csrfTokens.get(sessionId);
  
  console.log(`[CSRF] Validating for session: ${sessionId}, stored: ${!!stored}`);
  
  if (!stored || stored.expiresAt < Date.now()) {
    console.log('[CSRF] No stored token or expired');
    return false;
  }

  const token = req.headers['x-csrf-token'] || req.body?.csrfToken;
  const isValid = token === stored.token;
  
  console.log(`[CSRF] Token valid: ${isValid}`);
  return isValid;
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for ANY Bearer token authentication (JWT or API key)
  // JWT and API keys in Authorization header are inherently CSRF-resistant
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    console.log('[CSRF] Skipping CSRF for Bearer token authentication');
    return next();
  }

  // Only validate CSRF for unauthenticated requests (register, login, forgot password, etc.)
  if (!validateCsrfToken(req)) {
    console.log('[CSRF] CSRF validation failed for unauthenticated request');
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }

  console.log('[CSRF] CSRF validation passed');
  next();
}
