import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { users, refreshTokens, type User, type NewUser, type NewRefreshToken } from '../db/schema/index.js';
import env from '../config/env.js';
import { randomBytes } from 'crypto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string): string {
  const options: jwt.SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ userId, type: 'access' }, env.JWT_SECRET, options);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db.insert(refreshTokens).values({
    userId,
    token,
    expiresAt,
  } as NewRefreshToken);

  return token;
}

export async function verifyRefreshToken(token: string): Promise<User | null> {
  const [refreshToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
    .limit(1);

  if (!refreshToken || refreshToken.expiresAt < new Date()) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, refreshToken.userId)).limit(1);
  return user || null;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

export async function registerUser(email: string, password: string, name?: string): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
    } as NewUser)
    .returning();

  return user;
}

export async function loginUser(email: string, password: string): Promise<AuthTokens | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; type?: string };
    if (decoded.type !== 'access') {
      return null;
    }
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

  // Hash token before storing
  const tokenHash = await hashPassword(token);

  await db
    .update(users)
    .set({
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return token; // Return plain token (only shown once)
}

export async function verifyPasswordResetToken(token: string): Promise<User | null> {
  // Find users with non-expired reset tokens
  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      continue;
    }

    if (user.passwordResetExpires < new Date()) {
      continue; // Expired
    }

    // Compare token with hashed token
    const isValid = await verifyPassword(token, user.passwordResetToken);
    if (isValid) {
      return user;
    }
  }

  return null;
}

export async function resetPassword(token: string, newPassword: string): Promise<User | null> {
  const user = await verifyPasswordResetToken(token);
  if (!user) {
    return null;
  }

  const passwordHash = await hashPassword(newPassword);

  // Update password and clear reset token
  const [updatedUser] = await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  // Revoke all refresh tokens (force re-login)
  await revokeAllUserTokens(user.id);

  return updatedUser || null;
}
