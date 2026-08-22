import React, { useEffect, useState } from "react";
import { useGetUnreadNotificationCountQuery } from "@/redux/services/featuresApi";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface NotificationBadgeProps {
  className?: string;
  onCountChange?: (count: number) => void;
}

export function NotificationBadge({ className = "", onCountChange }: NotificationBadgeProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const { data: countResponse, refetch } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthenticated, // Only fetch if authenticated
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 60000, // Poll every 10 seconds
  });

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (countResponse) {
      // Handle different possible response structures
      let count = 0;
      
      if (typeof countResponse === "object" && countResponse !== null) {
        if ("unreadCount" in countResponse) {
          count = (countResponse as any).unreadCount || 0;
        } else if ("data" in countResponse && typeof (countResponse as any).data === "number") {
          count = (countResponse as any).data;
        }
      } else if (typeof countResponse === "number") {
        count = countResponse;
      }

      const finalCount = Math.max(0, count);
      setUnreadCount(finalCount);
      onCountChange?.(finalCount);
    }
  }, [countResponse, onCountChange]);

  // Listen for notification events to update count in real-time
  useEffect(() => {
    if (!isAuthenticated) return;

    const onNotification = () => {
      refetch();
    };

    window.addEventListener("app-notification-received", onNotification);
    return () => {
      window.removeEventListener("app-notification-received", onNotification);
    };
  }, [refetch, isAuthenticated]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span
      className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
