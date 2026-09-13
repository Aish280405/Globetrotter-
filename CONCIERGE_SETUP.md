# AI Trip Concierge - Setup & Integration Guide

## ✅ What's Been Implemented

### Phase 1: Foundation ✓
- Enhanced Prisma schema with TripConcierge, LocalVenue, UserPreference models
- Itinerary generation API with LLM + caching
- Date validation (no past dates, check-out after check-in)

### Phase 2: Proactive Notifications ✓
- Notification service with templates (weather, logistics, events, tips)
- Cron job endpoint for scheduled notifications
- Notification logging & tracking

### Phase 3: Chat Bot & WhatsApp Integration ✓
- Chat agent with intent classification & tool-calling
- WhatsApp webhook receiver for incoming messages
- Multi-turn conversation history tracking

---

## 🔧 Setup Instructions

### 1. **Notification Cron Job Setup**

To trigger notifications automatically, set up a scheduled cron service:

#### Option A: Vercel Cron (Production)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/notifications/cron",
      "schedule": "0 8,14,20 * * *"
    }
  ]
}
```

#### Option B: External Cron Service (e.g., EasyCron, cron-job.org)
Set up a scheduled HTTP POST to:
```
https://your-domain.com/api/notifications/cron?key=YOUR_CRON_SECRET
```

#### Option C: Manual Testing
Visit in your browser or curl:
```bash
curl "http://localhost:3000/api/notifications/send-test?secret=your_secret_cron_key_here"
```

---

### 2. **WhatsApp Integration Setup**

To enable WhatsApp bot replies, you need:

#### Option A: Twilio WhatsApp
1. Sign up at https://www.twilio.com/whatsapp
2. Get your Twilio credentials
3. Update `.env.local`:
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
WHATSAPP_BUSINESS_NUMBER=+1234567890
```

4. Configure webhook in Twilio:
   - Set webhook URL to: `https://your-domain.com/api/webhooks/whatsapp`
   - Webhook Token: `gaia_is_awesome` (or change in code)

#### Option B: WhatsApp Business API
1. Sign up at https://developers.facebook.com/docs/whatsapp/
2. Get your Business Account ID & API token
3. Configure webhook to: `https://your-domain.com/api/webhooks/whatsapp`
4. Update code in `app/api/webhooks/whatsapp/route.ts` to use your provider

#### Option C: Testing Without WhatsApp
The system will log all messages to console. No setup needed for testing.

---

### 3. **Required Environment Variables**

```env
# Existing
GOOGLE_API_KEY=your_key
GEMINI_API_KEY=your_key
DATABASE_URL=your_postgres_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
REDIS_HOST=localhost
REDIS_PORT=6379

# New
CRON_SECRET=your_secret_cron_key_here
WHATSAPP_WEBHOOK_TOKEN=gaia_is_awesome
# TWILIO_ACCOUNT_SID=optional_for_whatsapp
# TWILIO_AUTH_TOKEN=optional_for_whatsapp
# WHATSAPP_BUSINESS_NUMBER=optional_for_whatsapp
```

---

## 📱 WhatsApp Bot Examples

### User Can Ask:
- "What are good restaurants in Baga?"
- "Best beaches nearby?"
- "How do I get to Dudhsagar Falls?"
- "Any tips for transportation?"
- "What's happening tonight in Anjuna?"

### Bot Responds With:
- Restaurant recommendations from local database
- Activity suggestions
- Travel tips
- Personalized advice based on trip context

---

## 📊 Notification Templates

### Proactive Messages Sent Automatically:

1. **Check-in Tomorrow** (logistics)
   - "Your check-in is tomorrow! Here's parking info..."

2. **Check-in Today** (logistics)
   - "Welcome to Goa! Your concierge is ready to help."

3. **Weather Alert** (weather)
   - "Rain expected. We've updated your indoor plan."

4. **Event Alert** (event)
   - "Full moon party at Anjuna Beach tonight!"

5. **Daily Tips** (tip)
   - Restaurant reservations, safety tips, transport tips

---

## 🧪 Testing Endpoints

### Test Notification Job
```bash
curl "http://localhost:3000/api/notifications/send-test?secret=your_secret_cron_key_here"
```

### Test WhatsApp Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919999999999",
            "body": "What are good restaurants in Baga?",
            "timestamp": "1234567890"
          }]
        }
      }]
    }]
  }'
```

### Test Chat API
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Best things to do in Anjuna?",
    "conversationHistory": []
  }'
```

---

## 🎯 Next Steps

1. **Database Migration**: Run `npm run db:migrate` to create new tables
2. **Seed Local Venues**: Run `npm run db:seed` to populate restaurant/activity data
3. **Test Notifications**: Use test endpoint above
4. **Configure WhatsApp**: Follow integration setup above
5. **Deploy**: Push to production and configure cron schedules

---

## 🔑 API Keys You Need

| Service | Key | Where to Get |
|---------|-----|-------------|
| Google Gemini | API Key | https://aistudio.google.com/apikey |
| Clerk Auth | Publishable + Secret | https://dashboard.clerk.com |
| PostgreSQL | Connection URL | Your database provider |
| Redis | Host + Port | localhost or Redis Cloud |
| Twilio (optional) | Account SID + Token | https://www.twilio.com |
| WhatsApp (optional) | Business API token | https://developers.facebook.com |

---

## ✨ Features Summary

✅ **Itinerary Generation**: 5-sec AI-powered trip plans
✅ **Smart Date Validation**: No past dates, logical check-out dates
✅ **Proactive Notifications**: Weather, check-in, event alerts
✅ **WhatsApp Integration**: Real-time guest chat
✅ **Conversation Memory**: Multi-turn chats with context
✅ **Trip Context**: Knows guest location & dates
✅ **Fallback Navbar**: Works even if auth fails

---

## 🚀 Demo Ready

The entire system is demoable via:
1. **Chat Interface**: `/concierge` page for visual demo
2. **WhatsApp Bot**: Real-time messaging (when configured)
3. **Itinerary View**: Day-by-day plans with activities & meals

Perfect for a 5-minute pitch! 🎤
