import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from 'dotenv';

// Load the workspace-local environment file first, then fall back to .env
config({ path: '.env.local' });
config();

// Create a separate Redis connection for BullMQ (with required settings)
const queueRedis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USERNAME || 'default',
  maxRetriesPerRequest: null, // Required by BullMQ
  lazyConnect: false,
  enableOfflineQueue: true,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Import the main Redis connection for caching
import redis from './redis';

interface TravelDetails {
  destinations: string[];
  start_date: string;
  end_date: string;
  budget: string;
  travel_style: string;
  interests: string[];
  accommodation: string;
  transportation: string;
  special_requests: string;
}

// Main queue for processing travel plan jobs
export const travelPlanQueue = new Queue('travel-plan-queue', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Dead letter queue 1 for first retry
export const dlq1 = new Queue('travel-plan-dlq1', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    delay: 5000, // 5 second delay before retry
  },
});

// Dead letter queue 2 for second retry
export const dlq2 = new Queue('travel-plan-dlq2', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    delay: 10000, // 10 second delay before final retry
  },
});

// Worker for processing jobs from the main queue
export const worker = new Worker('travel-plan-queue', async (job) => {
  console.log(`Processing job ${job.id} with data:`, job.data);
  
  try {
    // Generate travel plan using actual LLM
    const travelPlan = await generateTravelPlan(job.data);
    
    // Store result in Redis cache
    await redis.set(`result:${job.id}`, JSON.stringify(travelPlan), 'EX', 3600); // 1 hour expiry
    
    return travelPlan;
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: queueRedis,
  concurrency: 2,
});

// Worker for processing jobs from DLQ1 (first retry)
export const dlq1Worker = new Worker('travel-plan-dlq1', async (job) => {
  console.log(`Retrying job ${job.id} from DLQ1 with data:`, job.data);
  
  // Simulate LLM processing with a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate travel plan (placeholder for actual LLM logic)
  const travelPlan = generateTravelPlan(job.data);
  
  // Store result in Redis cache with inputHash for future cache hits
  const resultWithHash = {
    ...travelPlan,
    inputHash: job.data.inputHash,
    requestKey: job.data.requestKey
  };
  await redis.set(`result:${job.id}`, JSON.stringify(resultWithHash), 'EX', 3600); // 1 hour expiry
  
  return travelPlan;
}, {
  connection: queueRedis,
  concurrency: 1,
});

// Worker for processing jobs from DLQ2 (final retry)
export const dlq2Worker = new Worker('travel-plan-dlq2', async (job) => {
  console.log(`Final retry for job ${job.id} from DLQ2 with data:`, job.data);
  
  // Simulate LLM processing with a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate travel plan (placeholder for actual LLM logic)
  const travelPlan = generateTravelPlan(job.data);
  
  // Store result in Redis cache with inputHash for future cache hits
  const resultWithHash = {
    ...travelPlan,
    inputHash: job.data.inputHash,
    requestKey: job.data.requestKey
  };
  await redis.set(`result:${job.id}`, JSON.stringify(resultWithHash), 'EX', 3600); // 1 hour expiry
  
  return travelPlan;
}, {
  connection: queueRedis,
  concurrency: 1,
});

// Handle job failures and move to appropriate DLQ
worker.on('failed', async (job, err) => {
  if (!job) return;
  
  console.log(`Job ${job.id} failed:`, err.message);
  
  if (job.attemptsMade < 1) {
    // Move to DLQ1 for first retry
    await dlq1.add(`retry-${job.id}`, job.data, {
      jobId: job.id,
      attempts: 1,
    });
  } else if (job.attemptsMade < 2) {
    // Move to DLQ2 for second retry
    await dlq2.add(`retry-${job.id}`, job.data, {
      jobId: job.id,
      attempts: 2,
    });
  } else {
    // Final failure - log and discard
    console.log(`Job ${job.id} failed permanently after ${job.attemptsMade} attempts`);
  }
});

dlq1Worker.on('failed', async (job, err) => {
  if (!job) return;
  
  console.log(`DLQ1 job ${job.id} failed:`, err.message);
  
  if (job.attemptsMade < 2) {
    // Move to DLQ2 for final retry
    await dlq2.add(`retry-${job.id}`, job.data, {
      jobId: job.id,
      attempts: 2,
    });
  } else {
    // Final failure - log and discard
    console.log(`DLQ1 job ${job.id} failed permanently after ${job.attemptsMade} attempts`);
  }
});

dlq2Worker.on('failed', async (job, err) => {
  if (!job) return;
  
  console.log(`DLQ2 job ${job.id} failed permanently:`, err.message);
  // Job has failed all retries - log and discard
});

// Actual LLM function for generating travel plan
async function generateTravelPlan(data: TravelDetails) {
  const { destinations, start_date, end_date, budget, travel_style, interests, accommodation, transportation, special_requests } = data;
  
  // Calculate duration from dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Call the actual LLM API
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generatePlanWithSummary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`LLM API failed: ${response.status}`);
    }

    const result = await response.json();
    return result.plan;
  } catch (error) {
    console.error('Error calling LLM API:', error);
    
    // Fallback to structured data if LLM fails
    const itinerary = [];
    for (let i = 1; i <= duration; i++) {
      const cityIndex = (i - 1) % destinations.length;
      const city = destinations[cityIndex];
      
      itinerary.push({
        day: `Day ${i}`,
        city: city,
        morning: `Explore ${city} - Morning activities based on ${travel_style} interests`,
        afternoon: `Continue exploring ${city} - Afternoon activities`,
        evening: `Evening in ${city} - Local experiences`,
        accommodation: accommodation || 'Hotel',
        meals: 'Local cuisine recommendations',
        estimated_cost: `₹${Math.floor(Math.random() * 1000) + 500}`,
      });
    }
    
    return {
      itinerary,
      total_estimated_cost: `₹${Math.floor(Math.random() * 5000) + 2000}`,
      travel_tips: [
        'Pack comfortable walking shoes',
        'Check local weather before departure',
        'Learn basic local phrases',
        `Focus on ${travel_style.toLowerCase()} experiences`,
        `Budget-friendly options for ${budget.toLowerCase()} travel`,
      ],
      packing_list: [
        'Passport and travel documents',
        'Comfortable clothing',
        'Travel adapter',
        'First aid kit',
        'Camera for capturing memories',
      ],
      emergency_contacts: {
        local_emergency: '112',
        embassy: 'Check local embassy information',
        hotel: 'Hotel contact details',
      },
    };
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  await dlq1Worker.close();
  await dlq2Worker.close();
  await queueRedis.quit();
  await redis.quit();
});

process.on('SIGINT', async () => {
  await worker.close();
  await dlq1Worker.close();
  await dlq2Worker.close();
  await queueRedis.quit();
  await redis.quit();
});
