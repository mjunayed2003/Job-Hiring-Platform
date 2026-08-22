"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { User, Settings, LogOut, ChevronRight, CheckCircle2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LogoutModal from "@/component/profile/LogoutModel";
import { RootState } from "@/redux/store";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showLogout, setShowLogout] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const buildImageUrl = (path?: string | null): string | null => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (!API_BASE) return null;
    return `${API_BASE}${path}`;
  };

  const handleDetailsClick = () => {
    switch (user?.role) {
      case "COMPANY":
        router.push("/company/profile/profile-details");
        break;
      case "EMPLOYER":
        router.push("/employer/profile-details");
        break;
      case "JOB_SEEKER":
      default:
        router.push("/jobseeker/profile-details");
        break;
    }
  };

  const displayName = user?.fullName || user?.name || "User Name";
  const displayAvatar =
    buildImageUrl(user?.profilePic) ||
    buildImageUrl(user?.avatar) ||
    "/image/profile-picture.png";
  const displayRole = user?.role?.replace("_", " ") || "Member";
  const isJobSeeker = user?.role === "JOB_SEEKER";

  return (
    <div className="max-w-5xl mx-auto pb-20 w-full">
      {/* Banner */}
      <div className="relative w-full h-[150px] md:h-[250px] overflow-hidden">
        <Image
          src="/image/profile-bg.jpg"
          alt="Banner"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-green-900/40" />
      </div>

      {/* User Info Section */}
      <div className="px-4 pt-7 md:px-10 -mt-12 md:-mt-16 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
        {/* Profile Image */}
        <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-lg shrink-0">
          <Image
            src={displayAvatar}
            alt="Profile"
            width={176}
            height={176}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Text Details */}
        <div className="text-center md:text-left space-y-1 md:mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[#3FAE2A]">
            {displayName}
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Role:{" "}
            <span className="text-gray-700 capitalize">{displayRole}</span>
          </p>
          <p className="text-sm text-gray-400">
            Location:{" "}
            <span className="text-gray-800">
              {(user as any)?.location || "Not specified"}
            </span>
          </p>
          <div className="flex gap-2 mt-3 justify-center md:justify-start flex-wrap">
            <Badge className="bg-blue-50 text-blue-500 border-none font-normal flex gap-1 px-2 py-1">
              <CheckCircle2 size={12} /> Id Verified
            </Badge>
            <Badge className="bg-blue-50 text-blue-500 border-none flex gap-1 font-normal px-2 py-1">
              <CheckCircle2 size={12} /> Face Verified
            </Badge>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-8 md:mt-12 h-[1px] bg-gray-100 mx-4 md:mx-10" />

      {/* Navigation List */}
      <div className="max-w-2xl mx-auto mt-8 md:mt-10 space-y-4 px-4">
        <ProfileListItem
          icon={<User className="text-white" size={18} />}
          label="Professional Details"
          onClick={handleDetailsClick}
        />

        {/* ← Wallet — শুধু JOB_SEEKER দেখবে */}
        {isJobSeeker && (
          <ProfileListItem
            icon={<Wallet className="text-white" size={18} />}
            label="Wallet"
            onClick={() => router.push("/jobseeker/wallet")}
          />
        )}

        <ProfileListItem
          icon={<Settings className="text-white" size={18} />}
          label="Settings"
          onClick={() => router.push("/settings")}
        />
        <ProfileListItem
          icon={<LogOut className="text-white" size={18} />}
          label="Log Out"
          iconBgClass="bg-black"
          onClick={() => setShowLogout(true)}
        />
      </div>

      {/* Logout Modal */}
      <LogoutModal open={showLogout} onOpenChange={setShowLogout} />
    </div>
  );
}

function ProfileListItem({
  icon,
  label,
  onClick,
  iconBgClass = "bg-[#3FAE2A]",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  iconBgClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition group"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBgClass}`}
        >
          {icon}
        </div>
        <span className="font-medium text-gray-700 text-sm md:text-base">
          {label}
        </span>
      </div>
      <ChevronRight size={18} className="text-gray-400 group-hover:text-[#3FAE2A]" />
    </button>
  );
}
