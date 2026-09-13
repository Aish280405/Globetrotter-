"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Filter,
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
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Fetch user's notifications
  async function fetchNotifications() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/notifications/logs");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    return notif.message_type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "logistics":
        return "🏨";
      case "weather":
        return "☔";
      case "event":
        return "🎉";
      case "tip":
        return "💡";
      default:
        return "📬";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "logistics":
        return "bg-blue-100 text-blue-800";
      case "weather":
        return "bg-yellow-100 text-yellow-800";
      case "event":
        return "bg-purple-100 text-purple-800";
      case "tip":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "text-green-600";
      case "FAILED":
        return "text-red-600";
      case "QUEUED":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Bell className="h-8 w-8 text-purple-600" />
            Your Notifications
          </h1>
          <p className="text-gray-600">
            Real-time updates about your trips
          </p>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              {["all", "logistics", "weather", "event", "tip"].map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(type)}
                  className="capitalize"
                >
                  {type === "all" ? (
                    <>
                      <Filter className="h-4 w-4 mr-2" />
                      All
                    </>
                  ) : (
                    <>{getIcon(type)} {type}</>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {error}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredNotifications.length === 0 && (
          <Card className="mb-6 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                {filter === "all"
                  ? "No notifications yet. Check back when your trip starts!"
                  : `No ${filter} notifications yet.`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {!loading && filteredNotifications.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 mb-4">
              Showing {filteredNotifications.length} notification
              {filteredNotifications.length !== 1 ? "s" : ""}
            </div>

            {filteredNotifications.map((notif) => (
              <Card key={notif.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getIcon(notif.message_type)}</span>
                        <Badge className={getTypeColor(notif.message_type)}>
                          {notif.message_type}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(notif.status)}>
                          {notif.status}
                        </Badge>
                      </div>

                      <p className="text-gray-800 mb-3">{notif.message_content}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {notif.sent_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(notif.sent_at).toLocaleDateString()}{" "}
                            {new Date(notif.sent_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                        {notif.phone_number && (
                          <div className="text-gray-400">To: {notif.phone_number}</div>
                        )}
                      </div>
                    </div>

                    {notif.status === "SENT" && (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                    {notif.status === "FAILED" && (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        {!loading && notifications.length > 0 && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    💡 How notifications work:
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • Automated notifications run 3x daily (8 AM, 2 PM, 8 PM)
                    </li>
                    <li>
                      • Only active trips receive notifications (check-in ≤ today ≤ check-out)
                    </li>
                    <li>
                      • Messages include check-in reminders, tips, weather alerts, and local events
                    </li>
                    <li>
                      • Notifications auto-refresh every 30 seconds
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
