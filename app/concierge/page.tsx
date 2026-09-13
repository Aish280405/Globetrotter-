"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calendar,
  MapPin,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import TripChatbot from "@/components/TripChatbot";

interface ItineraryDay {
  date: string;
  theme: string;
  activities: Array<{
    time: string;
    title: string;
    location: string;
    duration_mins: number;
  }>;
  meals: Array<{
    meal: "breakfast" | "lunch" | "dinner";
    restaurant?: string;
    cuisine?: string;
    tips?: string;
  }>;
  evening_tip?: string;
}

function getMinDate(): string {
  const today = new Date();
  today.setDate(today.getDate() + 1); // Tomorrow minimum
  return today.toISOString().split("T")[0];
}

export default function ConciergePage() {
  const [propertyLocation, setPropertyLocation] = useState("Baga");
  const minDate = getMinDate();
  const [checkIn, setCheckIn] = useState(minDate);
  const [checkOut, setCheckOut] = useState(() => {
    const date = new Date(minDate);
    date.setDate(date.getDate() + 5);
    return date.toISOString().split("T")[0];
  });
  const [itinerary, setItinerary] = useState<{
    days: ItineraryDay[];
    general_tips: string[];
    packing_suggestions: string[];
    budget_estimate?: string;
  } | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("generate");

  // Ensure checkout is always after checkin
  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    const checkInDate = new Date(value);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      checkInDate.setDate(checkInDate.getDate() + 5);
      setCheckOut(checkInDate.toISOString().split("T")[0]);
    }
  };

  const handleCheckOutChange = (value: string) => {
    const checkOutDate = new Date(value);
    const checkInDate = new Date(checkIn);
    if (checkOutDate > checkInDate) {
      setCheckOut(value);
    } else {
      setError("Check-out date must be after check-in date");
      setTimeout(() => setError(null), 3000);
    }
  };

  async function handleGenerateItinerary() {
    if (!propertyLocation || !checkIn || !checkOut) {
      setError("Please fill in all fields");
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      setError("Check-out date must be after check-in date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trips/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_location: propertyLocation,
          check_in: checkIn,
          check_out: checkOut,
          preferences: {
            activity_types: ["beach", "culture", "food"],
            budget_range: "mid-range",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate itinerary"
        );
      }

      const data = await response.json();
      setItinerary(data.itinerary);
      setTripId(data.trip_id);
      setActiveTab("itinerary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Generate error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI Trip Concierge
          </h1>
          <p className="text-gray-600">
            Generate personalized itineraries and chat with your AI travel
            guide for Goa
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="generate">Generate Itinerary</TabsTrigger>
            <TabsTrigger value="itinerary" disabled={!itinerary}>
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="chat" disabled={!tripId}>
              Chat with Concierge
            </TabsTrigger>
          </TabsList>

          {/* Generate Itinerary Tab */}
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>Create Your Personalized Trip Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      Property Location (Goa)
                    </label>
                    <select
                      value={propertyLocation}
                      onChange={(e) => setPropertyLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Baga">Baga</option>
                      <option value="Anjuna">Anjuna</option>
                      <option value="Palolem">Palolem</option>
                      <option value="South Goa">South Goa</option>
                      <option value="North Goa">North Goa</option>
                      <option value="Panjim">Panjim</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      Check-in Date
                    </label>
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      min={minDate}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be tomorrow or later
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      Check-out Date
                    </label>
                    <Input
                      type="date"
                      value={checkOut}
                      onChange={(e) => handleCheckOutChange(e.target.value)}
                      min={new Date(checkIn).toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be after check-in date
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleGenerateItinerary}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating your itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Itinerary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary">
            {itinerary && (
              <div className="space-y-4">
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Trip Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold">{propertyLocation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-semibold">
                          {itinerary.days.length} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Budget Estimate
                        </p>
                        <p className="font-semibold">
                          {itinerary.budget_estimate || "N/A"}
                        </p>
                      </div>
                    </div>

                    {itinerary.general_tips.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">General Tips:</p>
                        <ul className="space-y-1 text-sm text-gray-700">
                          {itinerary.general_tips.map((tip, idx) => (
                            <li key={idx}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Day-by-day itinerary */}
                <div className="space-y-4">
                  {itinerary.days.map((day, dayIdx) => (
                    <Card key={dayIdx}>
                      <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
                        <CardTitle className="text-lg">
                          Day {dayIdx + 1} - {day.theme}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{day.date}</p>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        {/* Activities */}
                        <div>
                          <h4 className="font-semibold mb-2">Activities</h4>
                          <div className="space-y-2">
                            {day.activities.map((activity, actIdx) => (
                              <div
                                key={actIdx}
                                className="flex gap-3 p-2 bg-gray-50 rounded"
                              >
                                <Badge variant="outline">{activity.time}</Badge>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {activity.title}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {activity.location} •{" "}
                                    {activity.duration_mins} mins
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Meals */}
                        <div>
                          <h4 className="font-semibold mb-2">Dining</h4>
                          <div className="space-y-2">
                            {day.meals.map((meal, mealIdx) => (
                              <div
                                key={mealIdx}
                                className="p-2 bg-blue-50 rounded"
                              >
                                <p className="font-medium text-sm capitalize">
                                  {meal.meal}:{" "}
                                  {meal.restaurant || meal.cuisine}
                                </p>
                                {meal.tips && (
                                  <p className="text-xs text-gray-600">
                                    {meal.tips}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Evening tip */}
                        {day.evening_tip && (
                          <div className="p-2 bg-purple-50 rounded text-sm">
                            <p className="font-medium">Evening:</p>
                            <p className="text-gray-700">{day.evening_tip}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Packing suggestions */}
                {itinerary.packing_suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Packing Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid md:grid-cols-2 gap-2 text-sm">
                        {itinerary.packing_suggestions.map(
                          (item, idx) => (
                            <li key={idx}>✓ {item}</li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            {tripId && (
              <div className="space-y-4">
                <TripChatbot tripId={tripId} propertyLocation={propertyLocation} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
