# WhatsApp Integration Setup Guide

## Overview
The GlobeTrotter WhatsApp integration allows users to chat with the AI Trip Concierge directly through WhatsApp to get restaurant recommendations, activity suggestions, and travel tips for their Goa trip.

## Architecture
- **Webhook Endpoint**: `/api/webhooks/whatsapp`
- **Chat Engine**: `lib/chat-agent.ts` with Gemini AI
- **Local Data**: Restaurants, activities, and venues stored in `local_venue` table
- **Message Handling**: Receives WhatsApp messages → LLM processing → Response sent back

## Setup Options

### Option 1: Twilio WhatsApp Sandbox (Easiest for Testing)

1. **Create Twilio Account**
   - Go to https://www.twilio.com
   - Sign up and verify phone number
   - Navigate to Messaging → Try it Out → Send an SMS

2. **Get Twilio Credentials**
   - Go to Console → Account SID (copy it)
   - Go to Auth Token (copy it)
   - Go to Messaging → Services → WhatsApp Sandbox

3. **Set Environment Variables** in `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155552671  # Twilio sandbox number (provided)
   WHATSAPP_WEBHOOK_TOKEN=gaia_is_awesome
   ```

4. **Deploy to Public URL**
   - The webhook needs to be publicly accessible
   - Deploy to Vercel or similar (local testing requires ngrok)
   - Update Twilio webhook settings to: `https://yourdomain.com/api/webhooks/whatsapp`

5. **Test**
   - Send message to Twilio sandbox number
   - Should receive response from AI concierge

### Option 2: Production WhatsApp Business API

1. **Get WhatsApp Business Account**
   - Set up at https://business.facebook.com/
   - Verify business information
   - Create WhatsApp Business app

2. **Get Access Token**
   - Go to App Settings → WhatsApp
   - Generate permanent access token
   - Add to `.env.local`:
   ```
   WHATSAPP_API_TOKEN=your_access_token
   WHATSAPP_PHONE_ID=your_phone_id
   ```

3. **Configure Webhook**
   - Set webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`
   - Verify token matches `WHATSAPP_WEBHOOK_TOKEN`

### Option 3: Development Mode (No Real Messages)

Currently, if `TWILIO_ACCOUNT_SID` is not set, messages are logged to console. This is useful for testing the chatbot logic without setting up external services.

```bash
# Messages will log to console only
npm run dev
# Send a POST request to http://localhost:3000/api/webhooks/whatsapp
```

## How It Works

### Message Flow
1. User sends WhatsApp message to bot number
2. Twilio/WhatsApp API sends webhook to `/api/webhooks/whatsapp` (POST)
3. System extracts phone number and message text
4. Looks up user based on phone number (searches trip_concierge records)
5. Gets active trip for user (if currently traveling)
6. Calls chat agent with message and conversation context
7. Chat agent:
   - Classifies user intent (restaurant, activity, weather, tips, etc.)
   - Executes relevant tool calls (search database)
   - Uses Gemini AI to generate response
   - Cleans up formatting for WhatsApp (plain text, no markdown)
8. Response sent back to user via WhatsApp

### Supported Commands
- **Restaurants**: "Find me a restaurant in Baga" → searches local venues
- **Activities**: "What activities in Anjuna?" → shows activities from database
- **Travel Tips**: "How to get around?" → provides transportation tips
- **Weather**: "What's the weather?" → provides weather information
- **General Q&A**: Any other travel questions answered by AI

## Local Data

The system includes seeded restaurant, activity, and venue data for Goa:

```bash
# Reseed database with fresh data
npx prisma db seed
```

### Adding More Venues

1. Edit `prisma/seed.ts`
2. Add to restaurants, activities, or other arrays
3. Run seed again

Example:
```typescript
{
  name: "My Restaurant",
  location: "Baga",
  type: "RESTAURANT",
  rating: 4.5,
  tags: ["seafood", "casual", "beachside"]
}
```

## Troubleshooting

### Messages not being received
- Check webhook URL is publicly accessible
- Verify webhook token matches
- Check Twilio console for failed webhook attempts
- Look at server logs for errors

### AI responses not generating
- Check GEMINI_API_KEY is set in .env.local
- Check Gemini API is working: `npm run test:gemini`
- Check chat-agent.ts logs in console

### User not found
- WhatsApp numbers must match a user's active trip
- For testing, add email containing phone digits to user account
- Or modify `getUserFromPhoneNumber` to use phone field when available

### Messages not sending back
- For Twilio: check Account SID and Auth Token are correct
- Check TWILIO_WHATSAPP_FROM number is correct
- For production: check WhatsApp Business API token is valid

## Testing Without WhatsApp

```bash
# Test chat agent directly
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me a restaurant in Baga"}'

# Test webhook verification
curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=gaia_is_awesome&hub.challenge=test"
```

## Next Steps

1. Set up Twilio account (free sandbox available)
2. Deploy to Vercel or similar
3. Configure webhook URL
4. Test with sample messages
5. For production, set up WhatsApp Business API

## API Endpoints

- **GET** `/api/webhooks/whatsapp` - Webhook verification (WhatsApp handshake)
- **POST** `/api/webhooks/whatsapp` - Receive messages
- **POST** `/api/chat` - Direct chat endpoint (for testing)

## Environment Variables

```
# Twilio (for sending messages)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155552671

# WhatsApp Business API (alternative)
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_ID=

# Webhook
WHATSAPP_WEBHOOK_TOKEN=gaia_is_awesome

# Required for chat
GEMINI_API_KEY=
DATABASE_URL=
```
