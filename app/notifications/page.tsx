"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
} from "lucide-react";

interface NotificationLog {
  id: string;
  trip_id: string;
  message_type: string;
  message_content: string;
  status: string;
  sent_at: string;
  phone_number?: string;
}

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cronSecret, setCronSecret] = useState("");

  // Fetch notification logs
  async function fetchLogs() {
    try {
      setLoading(true);
      // In production, you'd fetch real logs from /api/notifications/logs
      console.log("Fetching notification logs...");
      // setLogs(data);
    } catch (err) {
      setError("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }

  // Trigger cron job manually
  async function triggerCronJob() {
    if (!cronSecret) {
      setError("Please enter cron secret");
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/notifications/send-test?secret=${cronSecret}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Failed to trigger cron job");
      }

      const data = await response.json();
      setSuccess(
        `✓ Notifications sent! ${data.message || "Check logs for details"}`
      );

      // Refresh logs
      fetchLogs();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Bell className="h-8 w-8 text-purple-600" />
            Proactive Notification Agent
          </h1>
          <p className="text-gray-600">
            Manage scheduled notifications for guests during their trips
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle>Manual Trigger</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Cron Secret Key
              </label>
              <input
                type="password"
                value={cronSecret}
                onChange={(e) => setCronSecret(e.target.value)}
                placeholder="Enter CRON_SECRET from .env"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your .env.local file as CRON_SECRET
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            )}

            <Button
              onClick={triggerCronJob}
              disabled={testing || !cronSecret}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Notifications...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Trigger Notification Job
                </>
              )}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
              <p className="font-medium mb-2">ℹ️ How it works:</p>
              <ul className="space-y-1 text-blue-900">
                <li>
                  • Finds all active trips (check-in ≤ today ≤ check-out)
                </li>
                <li>
                  • Sends weather alerts, check-in reminders, event notifications
                </li>
                <li>• Logs all sent/failed messages</li>
                <li>
                  • In production: Run on a schedule (8 AM, 2 PM, 8 PM daily)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Notification Templates */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>Notification Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Check-in Tomorrow */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-start gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <h3 className="font-semibold text-blue-900">
                    Check-in Tomorrow
                  </h3>
                </div>
                <p className="text-sm text-blue-800">
                  "Your check-in is tomorrow! Here's parking info: Paid parking available near most Goa beaches. We recommend arriving after 2 PM."
                </p>
              </div>

              {/* Check-in Today */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <h3 className="font-semibold text-green-900">
                    Check-in Today
                  </h3>
                </div>
                <p className="text-sm text-green-800">
                  "Welcome to Goa! Your concierge is ready to help. Text 'help' for recommendations or ask specific questions."
                </p>
              </div>

              {/* Weather Alert */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <h3 className="font-semibold text-yellow-900">
                    Weather Alert
                  </h3>
                </div>
                <p className="text-sm text-yellow-800">
                  "Rain expected tomorrow! We've updated your indoor plan recommendations. Check your itinerary!"
                </p>
              </div>

              {/* Event Alert */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="flex items-start gap-2 mb-2">
                  <Bell className="h-5 w-5 text-purple-600 mt-0.5" />
                  <h3 className="font-semibold text-purple-900">Event Alert</h3>
                </div>
                <p className="text-sm text-purple-800">
                  "Tonight: Full moon beach party at Anjuna Beach! Gates open 9 PM. Music, food, dancing. Want a ride recommendation?"
                </p>
              </div>

              {/* Safety Tip */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <h3 className="font-semibold text-orange-900">Safety Tip</h3>
                </div>
                <p className="text-sm text-orange-800">
                  "Safety reminder: Keep valuables secure, use registered taxis at night, stay in well-lit areas."
                </p>
              </div>

              {/* Restaurant Tip */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-red-50 to-red-100">
                <div className="flex items-start gap-2 mb-2">
                  <Bell className="h-5 w-5 text-red-600 mt-0.5" />
                  <h3 className="font-semibold text-red-900">Restaurant Tip</h3>
                </div>
                <p className="text-sm text-red-800">
                  "Pro tip: Peak hours are 7-9 PM. Make reservations in advance for popular spots like Thalassa!"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Information */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-blue-900 mb-3">
                🕐 Production Schedule
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded">
                  <p className="text-sm font-medium text-blue-900">
                    8:00 AM
                  </p>
                  <p className="text-xs text-blue-700">
                    Morning alerts & check-in reminders
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm font-medium text-blue-900">
                    2:00 PM
                  </p>
                  <p className="text-xs text-blue-700">
                    Afternoon activity tips & weather updates
                  </p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm font-medium text-blue-900">
                    8:00 PM
                  </p>
                  <p className="text-xs text-blue-700">
                    Evening events & dinner recommendations
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded p-4">
              <h3 className="font-semibold text-purple-900 mb-3">
                ⚙️ Setup Instructions
              </h3>
              <ol className="space-y-2 text-sm text-purple-800">
                <li>
                  <strong>1. Vercel Cron (Recommended):</strong> Add to
                  vercel.json
                </li>
                <li className="ml-4 font-mono text-xs bg-white p-2 rounded">
                  "crons": [{"{"}"path": "/api/notifications/cron", "schedule":
                  "0 8,14,20 * * *"{"}"}]
                </li>
                <li className="mt-2">
                  <strong>2. External Cron Service:</strong> Visit
                  https://cron-job.org or EasyCron
                </li>
                <li className="ml-4">
                  URL:{" "}
                  <code className="bg-white p-1 rounded text-xs">
                    https://your-domain.com/api/notifications/cron?key=SECRET
                  </code>
                </li>
                <li className="mt-2">
                  <strong>3. Set Environment Variable:</strong> Add to .env
                </li>
                <li className="ml-4 font-mono text-xs bg-white p-2 rounded">
                  CRON_SECRET=your_secret_key_here
                </li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ What Happens When Triggered
              </h3>
              <ul className="space-y-1 text-sm text-green-800">
                <li>
                  ✓ Queries all active trips (check-in ≤ today ≤ check-out)
                </li>
                <li>✓ Generates contextual notifications for each trip</li>
                <li>✓ Sends via WhatsApp (when configured) or logs</li>
                <li>✓ Tracks delivery status in database</li>
                <li>
                  ✓ Retries failed messages (in production setup)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
