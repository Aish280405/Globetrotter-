import { NextRequest, NextResponse } from 'next/server';
import { getTravelPlanQueue } from '@/lib/queues';
import redis from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

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

export async function POST(req: NextRequest) {
  try {
    const travelData: TravelDetails = await req.json();
    
    // Create a unique key for this request
    const requestKey = uuidv4();
    
    // Check if we already have a result for this exact input
    const inputHash = JSON.stringify(travelData);
    const existingResult = await redis.get(`input:${inputHash}`);
    
    if (existingResult) {
      // Return existing result from cache
      const parsedResult = JSON.parse(existingResult);
      return NextResponse.json({
        key: requestKey,
        result: parsedResult,
        status: 'completed',
        message: 'Result retrieved from cache'
      });
    }
    
    // Check if a job is already processing this input
    const processingKey = `processing:${inputHash}`;
    const isProcessing = await redis.get(processingKey);
    
    if (isProcessing) {
      // Return the existing processing key
      return NextResponse.json({
        key: isProcessing,
        status: 'processing',
        message: 'Job already in progress'
      });
    }
    
    // Store the processing key to prevent duplicate jobs
    await redis.set(processingKey, requestKey, 'EX', 300); // 5 minute expiry
    
    // Enqueue the job
    const job = await getTravelPlanQueue().add('generate-travel-plan', {
      ...travelData,
      requestKey,
      inputHash
    }, {
      jobId: requestKey,
      removeOnComplete: true,
      removeOnFail: false,
    });
    
    console.log(`Job enqueued with ID: ${job.id}`);
    
    return NextResponse.json({
      key: requestKey,
      status: 'queued',
      message: 'Job submitted successfully',
      jobId: job.id
    });
    
  } catch (error) {
    console.error('Error submitting job:', error);
    return NextResponse.json(
      { error: 'Failed to submit job' },
      { status: 500 }
    );
  }
} 
