import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { redisConnectionOptions } from './redis';

// Create a separate Redis connection for BullMQ (with required settings)
const queueRedis = new Redis({
  ...redisConnectionOptions,
  maxRetriesPerRequest: null, // Required by BullMQ
});

// This module is a queue producer only. A BullMQ Worker must run in a dedicated,
// persistent process (not in a Vercel serverless function or build worker).
export const travelPlanQueue = new Queue('travel-plan-queue', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
