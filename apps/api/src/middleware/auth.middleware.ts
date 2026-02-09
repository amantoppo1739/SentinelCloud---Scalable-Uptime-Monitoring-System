import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service.js';
import { eq } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { users } from '../db/schema/index.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: typeof users.$inferSelect;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  // Check if it's an API key (starts with sc_live_)
  if (authHeader?.startsWith('Bearer sc_live_')) {
    // Delegate to API key middleware
    const { requireApiKey } = await import('./apiKey.middleware.js');
    return requireApiKey(req, res, next);
  }
  
  // Otherwise, treat as JWT token
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
  }

  req.userId = payload.userId;
  req.user = user;
  next();
}
