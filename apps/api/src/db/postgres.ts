import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import env from '../config/env.js';
import * as schema from './schema/index.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  ssl: env.POSTGRES_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

export async function closePostgres() {
  await pool.end();
}
