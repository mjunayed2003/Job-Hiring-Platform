import { useEffect } from "react";
import { useGetNotificationsQuery } from "@/redux/services/featuresApi";
import { showNotificationToast } from "@/component/ui/ToastNotification";

interface NotificationEventPayload {
  id?: string;
  message?: string;
  body?: string;
  title?: string;
  createdAt?: string;
  notification?: {
    body?: string;
    title?: string;
  };
}

/**
 * Hook to listen for notifications globally and show toast alerts
 * Should be used in the root layout component
 */
export function useNotificationListener() {
  const { refetch: refetchNotifications } = useGetNotificationsQuery(undefined, {
    skip: true, // Don't fetch on mount, only refetch when needed
  });

  useEffect(() => {
    const onNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationEventPayload>;
      const detail = customEvent.detail;

      if (!detail) {
        return;
      }

      // Extract title and message from the notification
      const title =
        detail.title ||
        detail.notification?.title ||
        "New Notification";

      const message =
        detail.message ||
        detail.body ||
        detail.notification?.body ||
        "You have a new notification";

      // Show toast notification
      showNotificationToast(title, message, 5000);

      // Refetch notifications to update the list
      refetchNotifications();
    };

    window.addEventListener("app-notification-received", onNotification);

    return () => {
      window.removeEventListener("app-notification-received", onNotification);
    };
  }, [refetchNotifications]);
}
