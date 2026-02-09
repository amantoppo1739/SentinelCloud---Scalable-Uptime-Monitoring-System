import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { apiKeys, type ApiKey, type NewApiKey } from '../db/schema/apiKeys.js';
import { randomBytes } from 'crypto';

const API_KEY_PREFIX = process.env.API_KEY_PREFIX || 'sc_live_';

export interface GeneratedApiKey {
  key: string;
  keyId: string;
  name?: string;
}

export async function generateApiKey(userId: string, name?: string): Promise<GeneratedApiKey> {
  // Generate random 32-character key
  const randomPart = randomBytes(16).toString('hex');
  const fullKey = `${API_KEY_PREFIX}${randomPart}`;
  
  // Hash the key before storing
  const keyHash = await bcrypt.hash(fullKey, 10);
  
  // Insert into database
  const [apiKey] = await db
    .insert(apiKeys)
    .values({
      userId,
      keyHash,
      name,
      isActive: true,
    } as NewApiKey)
    .returning();
  
  return {
    key: fullKey, // Return plain key only once
    keyId: apiKey.id,
    name: apiKey.name || undefined,
  };
}

export async function verifyApiKey(key: string): Promise<{ userId: string; keyId: string } | null> {
  // Check if key has correct prefix
  if (!key.startsWith(API_KEY_PREFIX)) {
    return null;
  }
  
  // Get all active API keys
  const allKeys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.isActive, true));
  
  // Check each key
  for (const storedKey of allKeys) {
    // Check expiration
    if (storedKey.expiresAt && storedKey.expiresAt < new Date()) {
      continue;
    }
    
    // Compare key with hash
    const isValid = await bcrypt.compare(key, storedKey.keyHash);
    if (isValid) {
      // Update lastUsedAt
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, storedKey.id));
      
      return {
        userId: storedKey.userId,
        keyId: storedKey.id,
      };
    }
  }
  
  return null;
}

export async function listUserApiKeys(userId: string): Promise<ApiKey[]> {
  return await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(apiKeys.createdAt);
}

export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const [apiKey] = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
    .returning();
  
  return !!apiKey;
}

export function maskApiKey(keyHash: string): string {
  // Return a masked version for display (first 8 chars + ... + last 4 chars)
  // Since we only have the hash, we'll use a placeholder
  return `${API_KEY_PREFIX}****...****`;
}
