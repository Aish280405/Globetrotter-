#!/usr/bin/env tsx

import { config } from 'dotenv';

// Load the workspace-local environment file first, then fall back to .env
config({ path: '.env.local' });
config();

console.log('🔧 Redis Setup Helper (Endpoint Method)');
console.log('=======================================\n');

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;
const redisUsername = process.env.REDIS_USERNAME;

console.log('Current Redis Configuration:');
console.log('Host:', redisHost || 'Not set (will use default)');
console.log('Port:', redisPort || 'Not set (will use default)');
console.log('Password:', redisPassword ? '***' : 'Not set');
console.log('Username:', redisUsername || 'Not set (will use default)');

console.log('\n📋 To configure Redis Cloud connection:');
console.log('1. Copy your Redis connection link');
console.log('2. Extract the host, port, and password from it');
console.log('3. Add these to your .env file:');

console.log('\nExample Redis connection link:');
console.log('redis://username:password@hostname:port');

console.log('\nExtract these values to your .env file:');
console.log('REDIS_HOST=hostname');
console.log('REDIS_PORT=port');
console.log('REDIS_PASSWORD=password');
console.log('REDIS_USERNAME=username');

if (!redisPassword) {
  console.log('\n❌ REDIS_PASSWORD is required for Redis Cloud');
  console.log('Please add it to your .env file');
} else if (!redisHost) {
  console.log('\n⚠️  REDIS_HOST not set, will use default endpoint');
  console.log('You can set it explicitly for clarity');
} else {
  console.log('\n✅ Redis configuration looks complete');
  console.log('You can now test the connection with: npm run test:redis');
} 