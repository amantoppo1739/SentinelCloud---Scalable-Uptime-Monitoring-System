import { db } from './postgres.js';
import { sql } from 'drizzle-orm';

export async function initDatabase() {
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    // Create monitors table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS monitors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        alert_email VARCHAR(255),
        webhook_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create refresh_tokens table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_monitors_user_id ON monitors(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_monitors_is_active ON monitors(is_active)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)
    `);

    // Add avatar_key to users if not exists (profile images in S3)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN avatar_key VARCHAR(512);
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END $$
    `);

    // Add password reset fields to users if not exists
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
        ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END $$
    `);

    // Create api_keys table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_hash VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        last_used_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for api_keys
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)
    `);

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}
