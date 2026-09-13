"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, CheckCircle, AlertCircle, Clock, Filter } from "lucide-react";

interface NotificationLog {
  id: string;
  trip_id: string;
  message_type: string;
  message_content: string;
  status: string;
  sent_at: string;
  phone_number?: string;
}

const TYPE_FILTERS = ["ALL", "LOGISTICS", "WEATHER", "EVENT", "TIP"];

const TYPE_ICON: Record<string, string> = {
  LOGISTICS: "🏨",
  WEATHER: "☔",
  EVENT: "🎉",
  TIP: "💡",
};

const TYPE_COLOR: Record<string, string> = {
  LOGISTICS: "bg-blue-100 text-blue-800",
  WEATHER: "bg-yellow-100 text-yellow-800",
  EVENT: "bg-purple-100 text-purple-800",
  TIP: "bg-green-100 text-green-800",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === "ALL"
    ? notifications
    : notifications.filter((n) => n.message_type === filter);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">Trip updates delivered automatically</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((type) => (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(type)}
              className="capitalize"
            >
              {type === "ALL" ? (
                <><Filter className="mr-1 h-3 w-3" /> All</>
              ) : (
                <>{TYPE_ICON[type]} {type.charAt(0) + type.slice(1).toLowerCase()}</>
              )}
            </Button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {filter === "ALL"
                ? "No notifications yet. They'll appear here once your trip starts."
                : `No ${filter.toLowerCase()} notifications yet.`}
            </p>
          </div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">
              {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((notif) => (
              <Card key={notif.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{TYPE_ICON[notif.message_type] ?? "📬"}</span>
                        <Badge className={`text-xs ${TYPE_COLOR[notif.message_type] ?? "bg-gray-100 text-gray-800"}`}>
                          {notif.message_type.charAt(0) + notif.message_type.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{notif.message_content}</p>
                      {notif.sent_at && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(notif.sent_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                    {notif.status === "SENT" && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />}
                    {notif.status === "FAILED" && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
