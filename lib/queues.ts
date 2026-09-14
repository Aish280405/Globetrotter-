import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { redisConnectionOptions } from './redis';

// Create a separate Redis connection for BullMQ (with required settings)
const queueRedis = new Redis({
  ...redisConnectionOptions,
  maxRetriesPerRequest: null, // Required by BullMQ
});

let travelPlanQueue: Queue | undefined;

// Do not construct BullMQ objects at module import time. Next.js imports API
// routes during Vercel builds, where no Redis connection should be opened.
export function getTravelPlanQueue(): Queue {
  if (!travelPlanQueue) {
    travelPlanQueue = new Queue('travel-plan-queue', {
      connection: queueRedis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }

  return travelPlanQueue;
}
