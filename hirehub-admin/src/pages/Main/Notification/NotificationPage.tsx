// src/pages/NotificationPage.tsx
// Using react-icons

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaRegUserCircle } from "react-icons/fa";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
} from "../../../redux/features/NotificationApi/NotificationApi";
import { getAbsoluteImageUrl } from "./Imageurl";
import type { NotificationItem } from "../../../redux/features/NotificationApi/Notification.types";

type NotificationRecord = Record<string, unknown>;

// ✅ Updated formatter for "time" field (not "createdAt")
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

const getNotificationLink = (notificationType?: string) => {
  if (!notificationType) return null;

  const [prefix, payload] = notificationType.split(":");
  if (prefix === "JOB_MATCH" && payload) {
    return `/jobs/${payload}/applicants`;
  }

  return null;
};

// ✅ Updated normalization for actual backend structure
const normalizeNotification = (item: NotificationRecord, index: number): NotificationItem => {
  // Your backend structure: senderName, senderProfilePic, message, time
  const senderName = getString(item.senderName);
  const senderProfilePic = getString(item.senderProfilePic);
  const message = getString(item.message);
  const timeStr = getString(item.time); // This is the timestamp
  const type = getString(item.type);

  const formatted = formatDateTime(timeStr);
  const logo = getAbsoluteImageUrl(senderProfilePic);

  return {
    id: getString(item.id) || `notification-${index}`,
    message: message || "New notification",
    title: senderName, // senderName becomes title
    time: formatted.time,
    date: formatted.date,
    isRead: getBoolean(item.isRead) ?? false,
    logo,
    createdAt: timeStr, // Use "time" field as createdAt
    senderName,
    senderProfilePic,
    type,
    link: getNotificationLink(type),
  };
};

const normalizeNotificationResponse = (raw: unknown): NotificationItem[] => {
  if (!raw) {
    return [];
  }

  // Check if it's a direct array
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      const normalizedItem =
        typeof item === "object" && item !== null ? (item as NotificationRecord) : {};
      return normalizeNotification(normalizedItem, index);
    });
  }

  // Check if it's wrapped in { success, data, ... }
  const response = typeof raw === "object" && raw !== null ? (raw as NotificationRecord) : {};

  const possibleArray =
    (Array.isArray(response.data) && response.data) ||
    (Array.isArray(response.notifications) && response.notifications) ||
    [];

  return possibleArray.map((item, index) => {
    const normalizedItem =
      typeof item === "object" && item !== null ? (item as NotificationRecord) : {};
    return normalizeNotification(normalizedItem, index);
  });
};

// ✅ Format relative time (e.g., "2 hours ago")
const formatNotificationTime = (timeStr?: string) => {
  if (!timeStr) return "";

  const date = new Date(timeStr);
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

export default function NotificationPage() {
  const navigate = useNavigate();
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

  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markNotificationAsRead] = useMarkAsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  // Log API response for debugging
  useEffect(() => {
    if (notificationsResponse) {
      console.log("📊 API Response:", notificationsResponse);
    }
  }, [notificationsResponse]);

  // Auto-mark all as read
useEffect(() => {
  return () => {
    markAllAsRead();
  };
}, []);

  // Log errors
  useEffect(() => {
    if (isError) {
      console.error("❌ Fetch error:", error);
    }
  }, [isError, error]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    return normalizeNotificationResponse(notificationsResponse);
  }, [notificationsResponse]);

  console.log("📋 Normalized notifications:", notifications);

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
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
      // navigate anyway
    } finally {
      navigate(notif.link);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:p-8 min-h-screen bg-white">
      {/* Header Section */}
      <div className="flex items-center gap-4 md:gap-24 mb-6 md:mb-10">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-gray-200 h-8 w-8 md:h-10 md:w-10 shrink-0 flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Go back"
        >
          <FaArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Notifications</h1>
      </div>

      {/* Notifications List */}
      <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
        {/* Loading State */}
        {isLoading && notifications.length === 0 && (
          <div className="p-4 border border-gray-200 rounded-xl text-sm text-gray-500 bg-white">
            Loading notifications...
          </div>
        )}

        {/* Error State */}
        {isError && notifications.length === 0 && (
          <div className="p-4 border border-red-200 rounded-xl space-y-2 bg-white">
            <p className="text-sm text-red-500 font-semibold">
              Failed to load notifications. Please refresh and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs text-blue-500 hover:text-blue-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && notifications.length === 0 && (
          <div className="p-4 border border-gray-200 rounded-xl text-sm text-gray-500 bg-white">
            No notifications yet.
          </div>
        )}

        {/* Notification Cards */}
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleOpenNotification(notif)}
            className={`relative p-3 md:p-4 flex gap-3 md:gap-4 transition-all duration-200 border rounded-xl md:rounded-2xl shadow-sm ${notif.link ? "cursor-pointer hover:shadow-md" : ""} ${!notif.isRead ? "bg-[#EAF6EA] border-green-100" : "bg-white border-gray-100"
              }`}
          >
            {/* Action Menu Button */}
            <div className="absolute right-2 top-2 z-10">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenuId((current) => (current === notif.id ? null : notif.id));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Notification actions"
              >
                <FiMoreVertical className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {openMenuId === notif.id && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl border border-gray-200 bg-white p-1 shadow-lg z-20">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteNotification(notif.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Avatar / Logo */}
            <div className="h-10 w-10 md:h-12 md:w-12 border bg-white shrink-0 overflow-hidden rounded-full flex items-center justify-center">
              {notif.logo && notif.logo !== "/logo.svg" ? (
                <img
                  src={notif.logo}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 flex items-center justify-center h-full w-full"><svg class="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>`;
                    }
                  }}
                />
              ) : (
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 flex items-center justify-center h-full w-full">
                  <FaRegUserCircle className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              )}
            </div>

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
                  : "Just now"}
              </div>
            </div>
          </div>
        ))}

        {/* Load More Button (if hasMore) */}
        {notifications.length > 0 && (
          <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
