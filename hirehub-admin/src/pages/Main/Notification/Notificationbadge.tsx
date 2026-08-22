// src/components/NotificationBadge.tsx

import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useGetUnreadCountQuery } from "../../../redux/features/NotificationApi/NotificationApi";

export default function NotificationBadge() {
  const navigate = useNavigate();
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = unreadData?.data?.unreadCount ?? 0;

  return (
    <button
      onClick={() => navigate("/notifications")}
      className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Notifications"
      title="View notifications"
    >
      <FaBell className="h-6 w-6 text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}