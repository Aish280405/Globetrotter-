# Proactive Notification Agent - Complete Setup Guide

## Overview

The Proactive Notification Agent automatically sends context-aware messages to guests during their trips:
- ✅ Check-in reminders (tomorrow + today)
- ✅ Weather alerts & plan adjustments
- ✅ Local event notifications
- ✅ Daily travel tips (restaurants, safety, transport)

---

## 🎯 How It Works

### Trigger Flow
```
Cron Job (8 AM, 2 PM, 8 PM)
    ↓
/api/notifications/cron endpoint
    ↓
Find all active trips (check_in ≤ today ≤ check_out)
    ↓
Generate notifications (based on rules)
    ↓
Send via WhatsApp / Log in database
    ↓
Track delivery status
```

### Notification Types

| Type | Trigger | Example |
|------|---------|---------|
| **logistics** | Check-in tomorrow/today | "Your check-in is tomorrow! Parking info: ..." |
| **weather** | Rain/sunny forecasted | "Rain expected! Updated indoor plan available" |
| **event** | Weekend/special events | "Full moon party at Anjuna Beach tonight!" |
| **tip** | Daily rotation | "Pro tip: Restaurants busiest 7-9 PM" |

---

## ⚙️ Setup Instructions

### Step 1: Set Environment Variables

Add to `.env.local`:

```env
# Existing
CRON_SECRET=your_secret_cron_key_here

# Optional: WhatsApp Integration
# TWILIO_ACCOUNT_SID=your_twilio_sid
# TWILIO_AUTH_TOKEN=your_twilio_token
# WHATSAPP_BUSINESS_NUMBER=+1234567890
```

### Step 2: Schedule Cron Job

#### Option A: Vercel (Production - Recommended)

Create `vercel.json` at project root:

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

This runs at **8 AM, 2 PM, 8 PM daily** (UTC).

#### Option B: External Cron Service

Use [cron-job.org](https://cron-job.org) or [EasyCron](https://easycron.com):

1. Create HTTP POST request to:
   ```
   https://your-domain.com/api/notifications/cron?key=YOUR_CRON_SECRET
   ```

2. Schedule: Daily at 8 AM, 2 PM, 8 PM

#### Option C: GitHub Actions

Create `.github/workflows/cron-notifications.yml`:

```yaml
name: Cron Notifications

on:
  schedule:
    - cron: '0 8,14,20 * * *'  # 8 AM, 2 PM, 8 PM UTC

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger notifications
        run: |
          curl -X POST \
            "${{ secrets.NOTIFICATION_URL }}" \
            -H "Content-Type: application/json"
```

### Step 3: Test Locally

Visit the notifications admin page:

```
http://localhost:3000/notifications
```

1. Enter your `CRON_SECRET`
2. Click "Trigger Notification Job"
3. Check server logs for output

---

## 📱 WhatsApp Integration (Optional)

### With Twilio WhatsApp

1. **Sign up**: https://www.twilio.com/whatsapp

2. **Get credentials**:
   - Account SID
   - Auth Token
   - WhatsApp Business Number

3. **Update .env.local**:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxx
   TWILIO_AUTH_TOKEN=your_token
   WHATSAPP_BUSINESS_NUMBER=+1234567890
   ```

4. **Uncomment code** in `lib/notification-service.ts`:
   ```typescript
   // Integration code for Twilio (currently commented)
   // await sendWhatsAppMessage(payload.phoneNumber, payload.content);
   ```

5. **Configure webhook** in Twilio:
   - Set webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
   - Webhook Token: `gaia_is_awesome`

### Without WhatsApp (Testing)

Messages are logged to console and database. Perfect for development!

---

## 🔧 API Endpoints

### Trigger Cron Job

```bash
# Manual trigger (requires CRON_SECRET)
curl "http://localhost:3000/api/notifications/send-test?secret=YOUR_CRON_SECRET"
```

### Cron Endpoint (Production)

```bash
POST /api/notifications/cron?key=CRON_SECRET
```

Returns:
```json
{
  "status": "success",
  "message": "Notification cron job executed",
  "timestamp": "2024-12-20T10:00:00Z"
}
```

### Notification Logs

```bash
GET /api/notifications/logs
```

Returns array of sent notifications.

### WhatsApp Webhook

```bash
POST /api/webhooks/whatsapp
```

Receives incoming WhatsApp messages and replies with chat agent.

---

## 📋 Notification Rules

### Check-in Notifications

- **Tomorrow**: "Your check-in is tomorrow! Here's parking info..."
- **Today**: "Welcome to Goa! Your concierge is ready to help..."

### Weather Notifications

Currently static (can be enhanced with weather API):
- Rain: "Rain expected. Updated indoor plan available."
- Sunny: "Perfect weather! Great for beach activities."

### Event Notifications

- **Friday**: "Weekend events happening! Goa Carnival celebrations..."
- **Any day**: Random event from local calendar

### Daily Tips (Rotating)

- Restaurant tips
- Transport tips
- Safety tips

---

## 🎨 Admin Panel

Access at: `http://localhost:3000/notifications`

Features:
- ✅ Manually trigger notification job
- ✅ View all notification templates
- ✅ See scheduling information
- ✅ Get setup instructions
- ✅ Real-time feedback on sent/failed messages

---

## 📊 Database Schema

When migrations are run, these tables will be created:

### notification_logs
```sql
id: UUID
trip_id: UUID (FK → trip_concierge)
message_type: ENUM (weather, logistics, event, tip)
message_content: TEXT
status: ENUM (QUEUED, SENT, FAILED)
phone_number: VARCHAR
sent_at: TIMESTAMP
metadata: JSONB (error details, delivery info)
created_at: TIMESTAMP
```

---

## 🧪 Example Responses

### Successful Run

```
✓ Running notification cron job at 2024-12-20T10:00:00Z
  Found 3 active trips
  
Guest 1 (Baga, Dec 20-25):
  ✓ Check-in today → "Welcome to Goa..."
  ✓ Daily tip → "Restaurant reservations..."
  
Guest 2 (Anjuna, Dec 19-24):
  ✓ Check-in tomorrow → "Your check-in is tomorrow..."
  ✓ Event alert → "Full moon party tonight!"
  
Guest 3 (Palolem, Dec 21-26):
  ✓ Daily tip → "Safety reminder..."

✅ Notification job complete: 7 sent, 0 failed
```

---

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Set `CRON_SECRET` in production environment
- [ ] Configure cron schedule (Vercel/GitHub Actions/EasyCron)
- [ ] (Optional) Set up Twilio WhatsApp integration
- [ ] Run database migrations: `npm run db:migrate`
- [ ] Seed local venues: `npm run db:seed`
- [ ] Test notification job manually
- [ ] Monitor logs for first few days

### Monitoring

1. **Log files**: Check `/api/notifications/logs`
2. **Failed messages**: Retry mechanism in `notification-service.ts`
3. **Rate limits**: Twilio free tier = 100 messages/day
4. **Delivery tracking**: Via Twilio webhooks

---

## 🔧 Troubleshooting

### Notifications Not Sending

**Check:**
1. Is cron job being triggered? (Check logs)
2. Are there active trips? (check_in ≤ today ≤ check_out)
3. Is database accessible? (For persistent logging)

### WhatsApp Not Working

**Check:**
1. Is Twilio configured? (Check `.env` variables)
2. Is webhook URL correct?
3. Do guest phone numbers have WhatsApp?

### Database Issues

**If tables don't exist:**
```bash
npm run db:migrate
npm run db:seed
```

---

## 📞 Support

For issues or questions:
1. Check logs: `http://localhost:3000/notifications`
2. Test manually: Click "Trigger Notification Job"
3. Review environment variables in `.env.local`
4. Check database connectivity

---

## 🎓 Learn More

- **Cron Syntax**: https://crontab.guru
- **Vercel Crons**: https://vercel.com/docs/crons
- **Twilio WhatsApp**: https://www.twilio.com/docs/whatsapp
- **Prisma Migrations**: https://www.prisma.io/docs/orm/prisma-migrate/getting-started

