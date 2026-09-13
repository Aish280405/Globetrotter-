# 🚀 Quick Start - AI Trip Concierge

## ⚡ 60-Second Setup

### 1. Environment Variables (Already Set)
✅ Check `.env.local` - should have:
```env
GEMINI_API_KEY=your_key
CRON_SECRET=your_secret_cron_key_here
```

### 2. Dev Server (Already Running)
✅ Running on: `http://localhost:3000`

### 3. Access Features

| Feature | URL | What It Does |
|---------|-----|--------------|
| 🎯 **Trip Concierge** | http://localhost:3000/concierge | Generate itineraries + chat |
| 🔔 **Notifications** | http://localhost:3000/notifications | Admin panel + manual trigger |
| 🗺️ **Travel Planner** | http://localhost:3000/llm | Old AI planner |
| 🌍 **Community** | http://localhost:3000/community | Reviews & ratings |

---

## 🎮 Try Right Now

### Step 1: Generate an Itinerary (30 seconds)
1. Go to: http://localhost:3000/concierge
2. Location: **Baga** (default)
3. Check-in: **Tomorrow**
4. Check-out: **5 days later**
5. Click: **"Generate AI Itinerary"**
6. ✅ See day-by-day plan with activities & restaurants

### Step 2: Chat with Concierge (30 seconds)
1. Scroll down to "Chat with Concierge"
2. Ask: **"What are good restaurants in Baga?"**
3. ✅ Get personalized recommendations

### Step 3: Test Notifications (45 seconds)
1. Go to: http://localhost:3000/notifications
2. Enter Secret: (from your CRON_SECRET in .env.local)
3. Click: **"Trigger Notification Job"**
4. ✅ See success message + check server logs

---

## 💬 Chat Examples

Try asking the bot:
- "Best restaurants in Baga?"
- "What activities in Anjuna?"
- "How do I get to Dudhsagar Falls?"
- "Any tips for transportation?"
- "What's happening tonight?"

---

## 📝 Important Files

| File | Purpose | Status |
|------|---------|--------|
| `app/concierge/page.tsx` | Main UI | ✅ Working |
| `app/notifications/page.tsx` | Admin panel | ✅ Working |
| `lib/chat-agent.ts` | AI logic | ✅ Working |
| `lib/notification-service.ts` | Notifications | ✅ Ready |
| `.env.local` | Secrets | ✅ Configured |

---

## 🔑 Secret Key Location

Your CRON_SECRET is in `.env.local`:
```bash
CRON_SECRET=your_secret_cron_key_here
```

Use this when triggering notifications manually.

---

## 📱 WhatsApp Setup (Optional)

To enable WhatsApp:
1. Get Twilio account
2. Add to `.env.local`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxx
   TWILIO_AUTH_TOKEN=your_token
   WHATSAPP_BUSINESS_NUMBER=+1234567890
   ```
3. Update webhook in Twilio dashboard

See `NOTIFICATIONS_SETUP.md` for details.

---

## 📊 What Happens Behind the Scenes

### Itinerary Generation
```
User inputs → LLM generates → Redis caches → Show to user
(5 seconds)
```

### Chat
```
User message → Classify intent → Find recommendations → Show response
(<1 second)
```

### Notifications
```
Cron triggered → Find active trips → Generate messages → Send/Log
(2-5 seconds for batch)
```

---

## ✅ Checklist

- [x] Server running (localhost:3000)
- [x] Environment variables set
- [x] Concierge page loading
- [x] Chat working
- [x] Notification admin accessible
- [x] Redis connected
- [x] Database schema ready (pending migration)

---

## 🆘 Troubleshooting

### Chat not responding?
→ Check API key in `.env.local`

### Notifications won't trigger?
→ Make sure you have correct CRON_SECRET

### Page not loading?
→ Refresh browser (Ctrl+Shift+R)

### Database errors?
→ Normal until migrations run: `npm run db:migrate`

---

## 🎓 Full Documentation

- **Setup Guide**: `CONCIERGE_SETUP.md`
- **Notifications Guide**: `NOTIFICATIONS_SETUP.md`
- **Implementation Status**: `IMPLEMENTATION_COMPLETE.md`

---

## 🎉 You're All Set!

Everything is built and ready to demo. Just visit:

### http://localhost:3000/concierge

Enjoy! 🚀
