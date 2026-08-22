"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from "@/redux/services/featuresApi";
import { getAbsoluteImageUrl } from "@/utils/imageUrl";

interface NotificationItem {
  id: string;
  message: string;
  title?: string;
  time: string;
  date: string;
  isRead: boolean;
  logo: string;
  createdAt?: string;
  type?: string;
  link?: string | null;
}

// Backend notification structure from API
interface BackendNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  createdBy?: string;
  user?: {
    id: string;
    email?: string;
    adminProfile?: {
      fullName?: string;
      profilePic?: string;
    };
    jobSeekerProfile?: {
      fullName?: string;
      profilePic?: string;
    };
    employerProfile?: {
      companyName?: string;
      fullName?: string;
      profilePic?: string;
    };
  };
  createdByUser?: {
    id: string;
    email?: string;
    adminProfile?: {
      fullName?: string;
      profilePic?: string;
    };
    jobSeekerProfile?: {
      fullName?: string;
      profilePic?: string;
    };
    employerProfile?: {
      companyName?: string;
      fullName?: string;
      profilePic?: string;
    };
  };
}

type NotificationRecord = Record<string, unknown>;

interface NotificationEventPayload {
  id?: string;
  message?: string;
  body?: string;
  title?: string;
  type?: string;
  senderName?: string;
  createdAt?: string;
  date?: string;
  time?: string;
  isRead?: boolean;
  read?: boolean;
  logo?: string;
  icon?: string;
  companyLogo?: string;
  senderProfilePic?: string | null;
  notification?: {
    body?: string;
    title?: string;
  };
}

const FOREGROUND_NOTIFICATIONS_KEY = "foregroundNotifications";

const getNotificationLink = (type?: string) => {
  if (!type) return null;

  const [prefix, payload] = type.split(":");
  if (prefix === "JOB_MATCH" && payload) {
    return `/jobseeker/jobs/${payload}`;
  }

  return null;
};

const formatDateTime = (input?: string) => {
  if (!input) {
    return { time: "", date: "" };
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return { time: "", date: "" };
  }

  return {
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: date.toLocaleDateString("en-GB"),
  };
};

const getString = (value: unknown) => (typeof value === "string" ? value : undefined);
const getBoolean = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const normalizeNotification = (item: NotificationRecord, index: number): NotificationItem => {
  // Handle backend notification format (from API)
  if ('createdAt' in item && ('title' in item || 'message' in item)) {
    const createdAt = getString(item.createdAt);
    const formatted = formatDateTime(createdAt);
    const type = getString(item.type);

    // Extract sender profile image from createdByUser first, then fallback to user
    let profilePic: string | undefined;
    const senderObj =
      item.createdByUser && typeof item.createdByUser === "object"
        ? (item.createdByUser as NotificationRecord)
        : item.user && typeof item.user === "object"
          ? (item.user as NotificationRecord)
          : undefined;

    if (senderObj) {
      const sourceObj = senderObj;
      
      // Try to get profile pic from employer, job seeker, or admin profile
      const employerProfile = sourceObj.employerProfile as NotificationRecord | undefined;
      const jobSeekerProfile = sourceObj.jobSeekerProfile as NotificationRecord | undefined;
      const adminProfile = sourceObj.adminProfile as NotificationRecord | undefined;

      profilePic =
        getString(employerProfile?.profilePic) ||
        getString(jobSeekerProfile?.profilePic) ||
        getString(adminProfile?.profilePic);

    }

    const logo = getAbsoluteImageUrl(profilePic);

    return {
      id: getString(item.id) || `notification-${index}`,
      message: getString(item.message) || getString(item.body) || "New notification",
      title: getString(item.title),
      time: formatted.time,
      date: formatted.date,
      isRead: getBoolean(item.isRead) ?? false,
      logo,
      createdAt: createdAt,
      type,
      link: getNotificationLink(type),
    };
  }

  // Handle Firebase foreground notification format
  const nestedNotification =
    typeof item.notification === "object" && item.notification !== null
      ? (item.notification as NotificationRecord)
      : undefined;

  const sourceTimestamp =
    getString(item.createdAt) || getString(item.time) || getString(item.date);

  const formatted = formatDateTime(sourceTimestamp);

  const rawTime = getString(item.time);
  const parsedRawTime = rawTime ? new Date(rawTime) : null;
  const isRawTimeDateLike =
    Boolean(parsedRawTime) && !Number.isNaN((parsedRawTime as Date).getTime());

  const senderProfilePic = getString(item.senderProfilePic);
  const normalizedLogo = getAbsoluteImageUrl(
    senderProfilePic ||
      getString(item.logo) ||
      getString(item.icon) ||
      getString(item.companyLogo),
  );

  return {
    id:
      getString(item._id) ||
      getString(item.id) ||
      getString(item.notificationId) ||
      `notification-${index}`,
    message:
      getString(item.message) ||
      getString(item.body) ||
      getString(nestedNotification?.body) ||
      getString(nestedNotification?.title) ||
      "New notification",
    title: getString(item.title) || getString(item.senderName),
    time: isRawTimeDateLike ? formatted.time : rawTime || formatted.time,
    date: getString(item.date) || formatted.date,
    isRead: getBoolean(item.isRead) ?? getBoolean(item.read) ?? false,
    logo: normalizedLogo,
    createdAt: sourceTimestamp,
    type: getString(item.type),
    link: getNotificationLink(getString(item.type)),
  };
};

const normalizeNotificationResponse = (raw: unknown): NotificationItem[] => {
  if (!raw) {
    return [];
  }

  // If the response is an array of notifications directly
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      const normalizedItem =
        typeof item === "object" && item !== null ? (item as NotificationRecord) : {};
      return normalizeNotification(normalizedItem, index);
    });
  }

  // If the response is an object with data structure
  const response = typeof raw === "object" && raw !== null ? (raw as NotificationRecord) : {};
  
  // Check for different possible data structures
  const possibleArray =
    (Array.isArray(response.data) && response.data) ||
    (Array.isArray(response.notifications) && response.notifications) ||
    (Array.isArray(response.results) && response.results) ||
    [];

  return possibleArray.map((item, index) => {
    const normalizedItem =
      typeof item === "object" && item !== null ? (item as NotificationRecord) : {};
    return normalizeNotification(normalizedItem, index);
  });
};

const getStoredForegroundNotifications = (): NotificationItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(FOREGROUND_NOTIFICATIONS_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item, index) => normalizeNotification(item, index));
  } catch {
    return [];
  }
};

export default function NotificationPage() {
  const router = useRouter();
  const [foregroundNotifications, setForegroundNotifications] = useState<NotificationItem[]>(
    getStoredForegroundNotifications,
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const {
    data: notificationsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetNotificationsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000,
  });

  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  // Auto-mark all notifications as read when page opens
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Log error for debugging
  useEffect(() => {
    if (isError) {
      console.error('Notification fetch error:', error);
    }
  }, [isError, error]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const onNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationEventPayload>;
      if (!customEvent.detail) {
        return;
      }

      const mapped = normalizeNotification(customEvent.detail as NotificationRecord, 0);
      setForegroundNotifications((prev) => [mapped, ...prev]);
      refetch();
    };

    window.addEventListener("app-notification-received", onNotification);
    return () => {
      window.removeEventListener("app-notification-received", onNotification);
    };
  }, [refetch]);

  const notifications = useMemo(() => {
    const apiNotifications = normalizeNotificationResponse(notificationsResponse);
    return [...foregroundNotifications, ...apiNotifications];
  }, [foregroundNotifications, notificationsResponse]);

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
      setForegroundNotifications((prev) => prev.filter((notification) => notification.id !== id));
      setOpenMenuId(null);
      refetch();
    } catch (deleteError) {
      console.error("Failed to delete notification:", deleteError);
    }
  };

  const handleOpenNotification = async (notif: NotificationItem) => {
    if (!notif.link) return;

    try {
      if (!notif.isRead) {
        await markNotificationAsRead(notif.id).unwrap();
      }
    } catch {
      // continue navigation even if marking read fails
    } finally {
      router.push(notif.link);
    }
  };








  const formatNotificationTime = (time: string) => {
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:p-8 min-h-screen bg-white">
      {/* Header Section */}
      <div className="flex items-center gap-4 md:gap-24 mb-6 md:mb-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full border border-gray-200 h-8 w-8 md:h-10 md:w-10 shrink-0"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Notification</h1>
      </div>

      {/* Notifications List */}
      <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
        {isLoading && notifications.length === 0 && (
          <Card className="p-4 text-sm text-gray-500">Loading notifications...</Card>
        )}

        {isError && notifications.length === 0 && (
          <Card className="p-4 space-y-2">
            <p className="text-sm text-red-500 font-semibold">
              Failed to load notifications. Please refresh and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs text-blue-500 hover:text-blue-700 underline"
            >
              Try Again
            </button>
          </Card>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <Card className="p-4 text-sm text-gray-500">No notifications yet.</Card>
        )}

        {notifications.map((notif) => (
          <Card
            key={notif.id}
            onClick={() => handleOpenNotification(notif)}
            className={`relative p-3 md:p-4 flex gap-3 md:gap-4 transition-all duration-200 border border-gray-100 shadow-sm rounded-xl md:rounded-2xl ${notif.link ? "cursor-pointer hover:shadow-md" : ""} ${!notif.isRead ? "bg-[#EAF6EA] border-none" : "bg-white"
              }`}
          >
            <div className="absolute right-2 top-2 z-10">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenuId((current) => (current === notif.id ? null : notif.id));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Notification actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {openMenuId === notif.id && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteNotification(notif.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
            {/* Avatar / Logo */}
            <Avatar className="h-10 w-10 md:h-12 md:w-12 border bg-white shrink-0 overflow-hidden rounded-full">
              <AvatarImage
                src={notif.logo}
                alt="Company Logo"
                className="h-full w-full object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </AvatarFallback>
            </Avatar>


            {/* Content Area */}
            <div className="flex flex-col justify-between flex-1 gap-1 md:gap-2">
              <div className="flex flex-col gap-0.5 md:gap-1">
                {notif.title && (
                  <p className="text-xs md:text-sm text-gray-900 font-semibold leading-snug md:leading-normal">
                    {notif.title}
                  </p>
                )}
                <p className="text-xs md:text-sm text-gray-700 font-medium leading-snug md:leading-tight">
                  {notif.message}
                </p>
              </div>

              {/* Timestamp */}
              <div className="text-[9px] md:text-[10px] text-gray-400 self-end font-medium">
                {notif.createdAt
                  ? formatNotificationTime(notif.createdAt)
                  : `${notif.time} ${notif.date}`.trim()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
