import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { config } from 'dotenv';

// Load the workspace-local environment file first, then fall back to .env
config({ path: '.env.local' });
config();

const configuredHost = process.env.REDIS_HOST || 'localhost';
const hostUrl = configuredHost.includes('://') ? new URL(configuredHost) : null;

// Supports normal Redis hostnames and Upstash-style https/rediss endpoints.
export const redisConnectionOptions: RedisOptions = {
  host: hostUrl?.hostname || configuredHost,
  port: parseInt(process.env.REDIS_PORT || hostUrl?.port || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USERNAME || 'default',
  tls: hostUrl?.protocol === 'https:' || hostUrl?.protocol === 'rediss:' ? {} : undefined,
  // Cache reads must never hold a web request open while Redis reconnects.
  maxRetriesPerRequest: 1,
  // Next.js imports route modules while generating static pages on Vercel.
  // Do not open a TCP socket at import time; the first Redis command connects.
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 5000,
  commandTimeout: 5000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const redis = new Redis(redisConnectionOptions);

// Handle connection events
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('⚠️  Redis connection error:', err.message);
  if (err.message.includes('NOAUTH')) {
    console.error('💡 Authentication failed. Check REDIS_PASSWORD in .env.local');
  } else if (err.message.includes('ECONNREFUSED')) {
    console.error('💡 Redis not running. Start Redis with: redis-server');
  }
});

redis.on('ready', () => {
  console.log('🚀 Redis ready to accept commands');
});

export default redis;
