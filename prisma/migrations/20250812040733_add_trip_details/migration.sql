-- AlterTable
ALTER TABLE "trips" ADD COLUMN "accommodation" TEXT,
ADD COLUMN "budget" TEXT,
ADD COLUMN "emergency_contacts" JSONB,
ADD COLUMN "interests" TEXT[],
ADD COLUMN "itinerary" JSONB,
ADD COLUMN "packing_list" TEXT[],
ADD COLUMN "plan_summary" TEXT,
ADD COLUMN "special_requests" TEXT,
ADD COLUMN "total_cost" TEXT,
ADD COLUMN "transportation" TEXT,
ADD COLUMN "travel_style" TEXT,
ADD COLUMN "travel_tips" TEXT[];
