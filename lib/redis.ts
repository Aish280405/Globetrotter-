import Redis from 'ioredis';
import { config } from 'dotenv';

// Load the workspace-local environment file first, then fall back to .env
config({ path: '.env.local' });
config();

// Redis connection with fallback to localhost
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USERNAME || 'default',
  maxRetriesPerRequest: null,
  lazyConnect: false,
  enableOfflineQueue: true,
  connectTimeout: 5000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

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
