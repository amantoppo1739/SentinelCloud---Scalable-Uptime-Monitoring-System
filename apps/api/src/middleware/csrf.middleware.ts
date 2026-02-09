import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

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

export function generateCsrfToken(req: Request): string {
  const sessionId = req.cookies?.sessionId || req.ip || 'default';
  const token = crypto.randomBytes(32).toString('hex');
  
  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return token;
}

export function getCsrfToken(req: Request): string | null {
  const sessionId = req.cookies?.sessionId || req.ip || 'default';
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

  const sessionId = req.cookies?.sessionId || req.ip || 'default';
  const stored = csrfTokens.get(sessionId);
  
  if (!stored || stored.expiresAt < Date.now()) {
    return false;
  }

  const token = req.headers['x-csrf-token'] || req.body?.csrfToken;
  return token === stored.token;
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API key authentication
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer sc_live_')) {
    return next();
  }

  if (!validateCsrfToken(req)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }

  next();
}
