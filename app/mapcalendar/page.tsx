"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Trash2 } from "lucide-react";

const MapView = dynamic(()=> import("@/components/MapView"),{ssr: false});

// Mapping of Goa locations to coordinates
const LOCATION_COORDINATES: Record<string, [number, number]> = {
  "Baga": [15.5897, 73.7997],
  "Anjuna": [15.5597, 73.8080],
  "Palolem": [14.0403, 73.9424],
  "South Goa": [14.0657, 73.8193],
  "North Goa": [15.4909, 73.8278],
  "Panjim": [15.4869, 73.8278],
  "Calangute": [15.5350, 73.7597],
  "Arambol": [15.6481, 73.7141],
};

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

interface Trip {
  id: string;
  property_name?: string;
  property_location: string;
  check_in: string;
  check_out: string;
  itinerary: {
    days: ItineraryDay[];
    general_tips: string[];
    packing_suggestions: string[];
    budget_estimate?: string;
  };
  created_at: string;
}

function App() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([26.9124, 75.7873]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCitySelect = (coordinates: [number, number]) => {
    setMapCenter(coordinates);
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to delete this trip? This cannot be undone.")) {
      return;
    }

    try {
      setDeleting(tripId);
      const response = await fetch("/api/trips/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete trip");
      }

      // Remove from local state
      const updatedTrips = trips.filter((t) => t.id !== tripId);
      setTrips(updatedTrips);

      // If deleted trip was selected, select the next one
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(updatedTrips.length > 0 ? updatedTrips[0] : null);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error deleting trip");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/trips/user-trips");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched trips:", data);
          setTrips(data);
          if (data.length > 0) {
            const firstTrip = data[0];
            setSelectedTrip(firstTrip);
            // Update map to show first trip's location
            const coords = LOCATION_COORDINATES[firstTrip.property_location];
            if (coords) {
              setMapCenter(coords);
            }
          }
        } else {
          console.error("Failed to fetch trips:", response.status);
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Update map when selected trip changes
  useEffect(() => {
    if (selectedTrip) {
      const coords = LOCATION_COORDINATES[selectedTrip.property_location];
      if (coords) {
        setMapCenter(coords);
      }
    }
  }, [selectedTrip?.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#DFECC6] pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </main>
    );
  }

  if (trips.length === 0) {
    return (
      <main className="min-h-screen bg-[#DFECC6] pt-20 px-4">
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold mb-4">No saved trips yet</h1>
          <p className="text-gray-600 mb-6">
            Generate an itinerary in Trip Concierge and save it to see your schedule here.
          </p>
          <Button asChild>
            <a href="/concierge">Create Trip Itinerary</a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#DFECC6] pt-20">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-5rem)] p-4 gap-4 box-border">
        {/* Left pane: Map and Trip Selector */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Map */}
          <div className="flex-1 rounded-2xl overflow-hidden bg-white shadow-lg h-[40vh] min-h-[300px]">
            <MapView center={mapCenter} itinerary={selectedTrip?.itinerary} />
          </div>

          {/* Trip Selector */}
          <div className="bg-white rounded-2xl shadow-lg p-4 max-h-[25vh] overflow-y-auto">
            <h3 className="font-semibold mb-3">Your Saved Trips</h3>
            <div className="space-y-2">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTrip?.id === trip.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setSelectedTrip(trip)}
                      className="flex-1 text-left"
                    >
                      <p className="font-semibold text-sm">{trip.property_location}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(trip.check_in).toLocaleDateString()} - {new Date(trip.check_out).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      disabled={deleting === trip.id}
                      className="flex-shrink-0 p-1 hover:bg-red-100 rounded text-red-600 transition-colors disabled:opacity-50"
                      title="Delete trip"
                    >
                      {deleting === trip.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right pane: Itinerary Details */}
        <div className="flex-1 min-w-0 rounded-2xl overflow-hidden bg-white shadow-lg p-6 flex flex-col min-h-[400px]">
          {selectedTrip && selectedTrip.itinerary?.days && selectedTrip.itinerary.days.length > 0 ? (
            <div className="overflow-y-auto space-y-4">
              {/* Trip Header */}
              <div className="pb-4 border-b">
                <h2 className="text-2xl font-bold mb-2">{selectedTrip.property_location}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedTrip.check_in).toLocaleDateString()} - {new Date(selectedTrip.check_out).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedTrip.itinerary.days.length} days
                  </span>
                </div>
              </div>

              {/* General Tips */}
              {selectedTrip.itinerary.general_tips?.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-semibold mb-2">💡 General Tips:</p>
                  <ul className="text-xs space-y-1">
                    {selectedTrip.itinerary.general_tips.map((tip, idx) => (
                      <li key={idx}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Day-by-day */}
              <div className="space-y-3">
                {selectedTrip.itinerary.days.map((day, dayIdx) => (
                  <Card key={dayIdx} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100 py-3">
                      <CardTitle className="text-base">
                        Day {dayIdx + 1} - {day.theme}
                      </CardTitle>
                      <p className="text-xs text-gray-600">{day.date}</p>
                    </CardHeader>
                    <CardContent className="pt-3 space-y-2 text-sm">
                      {/* Activities */}
                      {day.activities?.length > 0 && (
                        <div>
                          <p className="font-semibold text-xs mb-1">🎯 Activities</p>
                          <div className="space-y-1">
                            {day.activities.map((activity, actIdx) => (
                              <div key={actIdx} className="flex gap-2 text-xs">
                                <Badge variant="outline" className="flex-shrink-0">{activity.time}</Badge>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{activity.title}</p>
                                  <p className="text-gray-600 text-xs truncate">{activity.location}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Meals */}
                      {day.meals?.length > 0 && (
                        <div>
                          <p className="font-semibold text-xs mb-1">🍽️ Meals</p>
                          <div className="space-y-1">
                            {day.meals.map((meal, mealIdx) => (
                              <div key={mealIdx} className="text-xs p-1 bg-blue-50 rounded">
                                <p className="font-medium capitalize">{meal.meal}: {meal.restaurant || meal.cuisine}</p>
                                {meal.tips && <p className="text-gray-600 text-xs">{meal.tips}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evening */}
                      {day.evening_tip && (
                        <div className="text-xs p-1 bg-purple-50 rounded">
                          <p className="font-medium">🌙 Evening: {day.evening_tip}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Packing */}
              {selectedTrip.itinerary.packing_suggestions?.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold mb-2">🎒 Packing:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {selectedTrip.itinerary.packing_suggestions.map((item, idx) => (
                      <p key={idx}>✓ {item}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No itinerary available</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
