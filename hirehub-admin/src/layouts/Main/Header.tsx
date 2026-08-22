// src/components/Header.tsx

import { useNavigate } from "react-router-dom";
import { Avatar } from "antd";
import { FaBell } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import profileImage from "../../assets/images/profile.png";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/features/Auth/AuthSlice";
import { useGetUnreadCountQuery } from "../../redux/features/NotificationApi/NotificationApi";

const Header = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

const { data: unreadData } = useGetUnreadCountQuery(undefined, {
  pollingInterval: 30000,
});

const unreadCount = unreadData?.data?.unreadCount ?? 0;

  const baseUrl = import.meta.env.VITE_SERVER_URL || "";
  const avatarSrc =
    user?.profilePic && !user.profilePic.includes("undefined")
      ? `${baseUrl.replace(/\/$/, "")}${user.profilePic}`
      : profileImage;

  return (
    <div className="w-full h-[80px] bg-white border border-gray-200 rounded-xl px-10 flex justify-between items-center shadow-sm">
      <div>
        <h1 className="text-[28px] font-bold text-[#111] leading-none">Dashboard</h1>
        <p className="text-[#9E9E9E] text-[14px] mt-1">
          Hi, {user?.fullName || user?.name || "Admin"}. Welcome back!
        </p>
      </div>

      <div className="flex items-center gap-x-5">
        {/* Notifications Button */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative bg-[#E9F3FF] w-[48px] h-[48px] flex items-center justify-center rounded-xl hover:opacity-80 transition-all hover:bg-blue-100" // 👈 relative add
          title="Notifications"
          aria-label="Go to notifications"
        >
          <FaBell size={24} className="text-[#007AFF]" />

          {/* 👇 Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-[4px] flex items-center justify-center rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          className="bg-[#FFF0F0] w-[48px] h-[48px] flex items-center justify-center rounded-xl hover:opacity-80 transition-all hover:bg-red-100"
          title="Settings"
          aria-label="Settings"
          onClick={() => navigate("/settings/profile")}
        >
          <IoSettingsOutline size={24} className="text-[#FF4D4F]" />
        </button>

        <div className="h-10 w-[1px] bg-gray-200 mx-2"></div>

        <button
          onClick={() => navigate("/settings/profile")}
          className="flex items-center gap-4 hover:opacity-80 transition-all"
        >
          <div className="text-right hidden lg:block">
            <p className="text-[14px] font-semibold text-[#111]">
              {user?.fullName || user?.name || "Admin"}
            </p>
            <p className="text-[12px] text-gray-400">{user?.email || ""}</p>
          </div>
          <Avatar
            size={52}
            src={avatarSrc}
            className="border border-gray-100 shadow-sm cursor-pointer"
          />
        </button>
      </div>
    </div>
  );
};

export default Header;