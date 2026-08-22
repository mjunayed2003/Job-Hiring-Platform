"use client";

import { ToastContainer } from "@/component/ui/ToastNotification";
import { useNotificationListener } from "@/hooks/useNotificationListener";

export function NotificationProvider() {
  // Listen for notifications globally
  useNotificationListener();

  return <ToastContainer />;
}
