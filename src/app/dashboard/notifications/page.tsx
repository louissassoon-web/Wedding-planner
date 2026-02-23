"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "task" | "rsvp" | "payment" | "milestone" | "general";
  read: boolean;
  createdAt: string;
  link?: string;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome to your wedding planner!",
    message: "Start by adding your wedding date and first tasks.",
    type: "general",
    read: false,
    createdAt: "Just now",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "task":
        return "bg-primary";
      case "rsvp":
        return "bg-sage-500";
      case "payment":
        return "bg-amber-500";
      case "milestone":
        return "bg-rose-500";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearAll} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No notifications</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;re all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    notification.read ? "bg-background" : "bg-primary/5"
                  }`}
                >
                  <div
                    className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${getTypeColor(
                      notification.type
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${notification.read ? "" : "text-foreground"}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {notification.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
