import { MongoClient, Db } from 'mongodb';
import env from '../config/env.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!client) {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
  }

  const dbName = new URL(env.MONGODB_URI).pathname.slice(1) || 'sentinelcloud';
  db = client.db(dbName);

  // Create indexes
  const pingLogs = db.collection('ping_logs');
  await pingLogs.createIndex({ monitorId: 1, timestamp: -1 });
  await pingLogs.createIndex({ timestamp: -1 });

  return db;
}

export async function closeMongoDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getMongoDB(): Db {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return db;
}
