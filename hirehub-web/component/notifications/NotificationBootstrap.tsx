"use client";

import { useEffect } from "react";
import {
  onForegroundMessage,
} from "@/lib/notification";

const FOREGROUND_NOTIFICATIONS_KEY = "foregroundNotifications";

interface FirebaseMessagePayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    message?: string;
  };
}

const safeReadStoredNotifications = () => {
  try {
    const stored = localStorage.getItem(FOREGROUND_NOTIFICATIONS_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getMessageText = (payload: unknown): string => {
  const messagePayload =
    typeof payload === "object" && payload !== null ? (payload as FirebaseMessagePayload) : {};

  return (
    messagePayload.notification?.body ||
    messagePayload.data?.message ||
    messagePayload.notification?.title ||
    "New notification"
  );
};

export default function NotificationBootstrap() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      unsubscribe = await onForegroundMessage((payload) => {
        if (typeof window === "undefined") {
          return;
        }

        const message = getMessageText(payload);

        const eventPayload = {
          id: `foreground-${Date.now()}`,
          message,
          isRead: false,
          logo: "/image/logo.svg",
          createdAt: new Date().toISOString(),
        };

        const previous = safeReadStoredNotifications();
        const next = [eventPayload, ...previous].slice(0, 50);
        localStorage.setItem(FOREGROUND_NOTIFICATIONS_KEY, JSON.stringify(next));

        window.dispatchEvent(new CustomEvent("app-notification-received", { detail: eventPayload }));
      });
    };

    void init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return null;
}
