# AI Trip Concierge (Post-Booking Agent)

## Problem Statement

Booking platforms lose connection with guests at checkout. The actual trip—where loyalty and upsell opportunities live—happens outside the platform. We're building an AI Trip Concierge to maintain that relationship through personalized itineraries, proactive notifications, and a conversational interface.

## Core Features

### 1. Itinerary Generator
Generate day-by-day travel plans based on:
- **Inputs**: Booked property location + check-in/check-out dates
- **Output**: Structured itinerary with attractions, restaurants, activities
- **Data Sources**: LLM-generated recommendations + curated local dataset (Goa focus)
- **Example**: "Day 1 in Goa: Baga Beach (morning) → seafood lunch at Thalassa → evening walk at Sunset Point"

### 2. Proactive Notification Agent
Scheduled jobs that send context-aware messages:
- **Weather alerts**: "Monsoon expected tomorrow, here's an indoor plan"
- **Logistics reminders**: "Check-in is tomorrow, here's parking info"
- **Local events**: "Full moon party at Anjuna tonight!"
- **Pattern**: Cron-style scheduling (via BullMQ + Redis queues already set up)

### 3. Conversational Interface
WhatsApp/Telegram bot for guest queries:
- "What's a good dinner spot near me tonight?"
- "Best beach for sunset?"
- "How do I get to Dudhsagar Falls from here?"
- **Pattern**: LLM agent with tool-calling (similar to travel planner already built)

### 4. Local Recommendation Dataset
Curated/scraped knowledge base:
- Restaurants, bars, cafes (tagged by cuisine, vibe, price range)
- Activities & attractions (tagged by location, duration, type)
- Transport options (taxis, scooters, buses)
- All tagged with GPS coordinates, area clusters, ratings

## Tech Stack

### Existing (Reuse)
- **LLM**: Google Generative AI (already integrated)
- **Queue System**: BullMQ + Redis (already set up)
- **Database**: PostgreSQL + Prisma (already set up)
- **Messaging**: Svix webhooks pattern (can adapt for WhatsApp/Telegram)

### New Components
- **Notification Service**: Cron scheduler + message dispatcher
- **Knowledge Base**: JSON/CSV of local recommendations
- **Chat Interface**: WhatsApp/Telegram bot connector
- **Agent Orchestrator**: Tool-calling wrapper for multi-step queries

## Success Criteria

1. ✅ Itinerary generates within 5 seconds for any property + dates
2. ✅ Notifications sent at scheduled times (no manual intervention)
3. ✅ Chat bot responds to natural language queries with accurate local info
4. ✅ Demoable live via chat interface (visual, 5-min pitch ready)

## Scope

**In Scope**:
- Itinerary generation for Goa properties
- Notification scheduling + basic message templates
- WhatsApp bot integration (or Telegram fallback)
- Local recommendation dataset (curated JSON)

**Out of Scope**:
- Multi-city support (Goa only for MVP)
- Payment/upsell integration (info only)
- Mobile app (chat interface is enough)
- Complex ML recommendation engine (rule-based + LLM is sufficient)

---

## Requirements

### R1: Itinerary Generation Engine
- Given: property ID, check-in date, check-out date, guest preferences (optional)
- Output: 5-day JSON itinerary with meals, activities, travel times
- Combine: 40% curated local data + 60% LLM generation
- Cache: 24-hour TTL (same dates = same itinerary)

### R2: Local Dataset
- Minimum 200 restaurants (with cuisine, vibe, coordinates)
- Minimum 100 activities (with location, type, duration)
- Minimum 50 transport options (with pricing)
- JSON structure: `{ id, name, type, location, rating, tags, coordinates }`

### R3: Notification Agent
- Cron job runs daily at 8 AM, 2 PM, 8 PM (guest timezone)
- Message types: weather, logistics, events, tips
- Rules-based logic (no ML): "If weather = rain AND day = today, send indoor plan"
- Delivery: WhatsApp API (fallback: email)

### R4: Chat Interface
- Accept: natural language queries from WhatsApp/Telegram
- Agent logic: Classify query type → fetch relevant tools → generate response
- Tools: search_restaurants, search_activities, get_directions, check_weather
- Response: Text + optional image/link

### R5: Data Pipeline
- Initial: Manual curation of Goa dataset (Figma spreadsheet export)
- Ongoing: Scrape Google Maps / TripAdvisor weekly (async job)
- Update: All new venues go into Redis cache + PostgreSQL

---

## Design

### Architecture Diagram
```
Guest books trip
    ↓
[Booking event] → Trigger itinerary generation
    ↓
[Itinerary Service] 
    - Query property location
    - Fetch local dataset from Redis
    - Call LLM for Day 1 plan (cached for 24h)
    - Store in DB
    ↓
[Notification Queue] 
    - Daily cron: fetch active guests
    - Generate messages (weather + tips)
    - Queue via BullMQ
    ↓
[Messaging Service]
    - Dequeue messages
    - Send via WhatsApp API
    - Log delivery status
    ↓
[Chat Bot]
    - Webhook: receive WhatsApp message
    - Agent: classify intent + call tools
    - Response: send back via WhatsApp
```

### Database Schema

#### `TripConcierge` table
```sql
id (PK)
booking_id (FK) → Booking
guest_id (FK) → User
property_id (FK) → Property
check_in (Date)
check_out (Date)
itinerary (JSONB) — cached day-by-day plan
preferences (JSONB) — dietary, activity type, budget
created_at
updated_at
```

#### `LocalVenue` table (Redis + PostgreSQL)
```sql
id (PK)
name (String)
type (Enum: restaurant, activity, transport)
location (String) — Goa area
rating (Float)
tags (Array) — cuisine, vibe, price range
coordinates (Point) — for distance queries
metadata (JSONB) — hours, phone, website
```

#### `NotificationLog` table
```sql
id (PK)
trip_id (FK) → TripConcierge
message_type (Enum)
status (Enum: queued, sent, failed)
sent_at
phone_number
raw_response (JSONB)
```

### API Endpoints

#### POST /api/trips/generate
Request:
```json
{
  "booking_id": "booking_123",
  "property_id": "prop_456",
  "check_in": "2024-12-20",
  "check_out": "2024-12-25",
  "preferences": { "cuisine": "seafood", "activity": "beach" }
}
```
Response: Itinerary (cached or newly generated)

#### POST /api/trips/{trip_id}/notify
Trigger immediate notification (for testing)
Response: Message queued status

#### POST /api/webhooks/whatsapp
Receive incoming WhatsApp message
- Parse: extract phone, message text
- Agent: classify + respond
- Send: via WhatsApp API

### LLM Prompts

#### Itinerary Generation
```
You are a travel concierge for Goa, India.
Guest is staying in [LOCATION] from [DATE] to [DATE].
Preferences: [PREFS]

Available venues (restaurants, activities, transport):
[JSON of top 20 venues within 5km]

Generate a detailed, day-by-day itinerary:
- Include 2-3 activities per day
- At least one restaurant recommendation per day
- Include travel times between locations
- Respect guest preferences

Format as JSON:
{
  "day_1": {
    "date": "2024-12-20",
    "theme": "Beach & Sunset",
    "activities": [
      { "time": "09:00", "title": "...", "location": "...", "duration_mins": 120 }
    ],
    "meals": [
      { "meal": "lunch", "restaurant": "...", "cuisine": "..." }
    ]
  }
}
```

#### Chat Agent Classification
```
Classify this guest query into one of: search_restaurant, search_activity, get_directions, check_weather, get_tips

Query: [USER_MESSAGE]

Respond with: { "intent": "...", "extracted_params": {...} }
```

---

## Implementation Tasks

### Phase 1: Foundation (Week 1)
- [ ] T1.1: Create TripConcierge + LocalVenue schema in Prisma
- [ ] T1.2: Seed database with 200 Goa restaurants (manual JSON)
- [ ] T1.3: Seed database with 100 Goa activities
- [ ] T1.4: Create `/api/trips/generate` endpoint (LLM + caching)

### Phase 2: Notifications (Week 2)
- [ ] T2.1: Create notification job in BullMQ
- [ ] T2.2: Implement weather-based rules engine
- [ ] T2.3: Set up WhatsApp API integration (Twilio or similar)
- [ ] T2.4: Create notification dispatcher + logging

### Phase 3: Chat Bot (Week 3)
- [ ] T3.1: Create WhatsApp webhook receiver
- [ ] T3.2: Build agent classifier (intent detection)
- [ ] T3.3: Implement tool-calling system (search, directions, etc.)
- [ ] T3.4: Create response formatter + error handling

### Phase 4: Polish & Demo (Week 4)
- [ ] T4.1: Frontend chat widget (for demo)
- [ ] T4.2: Admin dashboard (active trips, notification logs)
- [ ] T4.3: End-to-end testing + edge cases
- [ ] T4.4: Demo script + pitch materials

---

## Success Metrics

- **Itinerary Quality**: Guest satisfaction score (NPS) ≥ 8/10
- **Notification Engagement**: Open rate ≥ 40%, click rate ≥ 15%
- **Chat Bot Accuracy**: 85% of queries answered correctly (no manual escalation)
- **Performance**: Itinerary generation < 3 seconds, chat response < 1 second
