"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Settings, LogOut, ChevronRight, CheckCircle2, Crown, Loader, AlertCircle, CalendarDays, BadgeCheck, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LogoutModal from "@/component/profile/LogoutModel";
import { useGetEmployerProfileQuery } from "@/redux/services/employerApi";

type CompanyProfileResponse = {
  data?: {
    id?: string;
    companyName?: string | null;
    fullName?: string | null;
    profilePic?: string | null;
    location?: string | null;
    licenseFile?: string | null;
    isVerified?: boolean;
    subscription?: {
      id?: string;
      planName?: string | null;
      price?: number | null;
      duration?: number | null;
      slotsAvailable?: number | null;
      effectiveSlotsAvailable?: number | null;
      remainingDays?: number | null;
      startDate?: string | null;
      expiryDate?: string | null;
      isActive?: boolean | null;
    } | null;
  };
  companyName?: string | null;
  fullName?: string | null;
  profilePic?: string | null;
  location?: string | null;
  licenseFile?: string | null;
  isVerified?: boolean;
  subscription?: {
    id?: string;
    planName?: string | null;
    price?: number | null;
    duration?: number | null;
    slotsAvailable?: number | null;
    effectiveSlotsAvailable?: number | null;
    remainingDays?: number | null;
    startDate?: string | null;
    expiryDate?: string | null;
    isActive?: boolean | null;
  } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const { data: profileResponse, isLoading, error } = useGetEmployerProfileQuery() as {
    data?: CompanyProfileResponse;
    isLoading: boolean;
    error?: unknown;
  };

  const profile = profileResponse?.data ?? profileResponse ?? {};

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

  const buildImageUrl = (path?: string | null): string | null => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (!API_BASE) return null;
    return `${API_BASE}${path}`;
  };

  const displayName = profile.companyName || profile.fullName || "Company";
  const displayAvatar = buildImageUrl(profile.profilePic) || "/image/profile-picture.png";
  const displayLocation = profile.location || "Bangladesh";
  const isVerified = Boolean(profile.licenseFile);
  const subscription = profile.subscription ?? null;
  const hasActiveSubscription = Boolean(subscription?.isActive) && Number(subscription?.remainingDays ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader className="animate-spin text-[#3FAE2A]" size={34} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to load profile</p>
            <p className="text-sm text-red-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 w-full">
      <div className="relative w-full h-[150px] md:h-[250px] overflow-hidden">
        <Image
          src="/image/profile-bg.jpg"
          alt="Banner"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-green-900/40" />
      </div>

      <div className="px-4 pt-7 md:px-10 -mt-12 md:-mt-16 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
        <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-lg shrink-0">
          <Image
            src={displayAvatar}
            alt="Profile"
            width={176}
            height={176}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="text-center md:text-left space-y-1 md:mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[#3FAE2A]">
            {displayName}
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Role: <span className="text-gray-700 capitalize">Company</span>
          </p>
          <p className="text-sm text-gray-400">
            Location: <span className="text-gray-800">{displayLocation}</span>
          </p>

          <div className="flex gap-2 mt-3 justify-center md:justify-start flex-wrap">
            <Badge className="bg-blue-50 text-blue-500 border-none font-normal flex gap-1 px-2 py-1">
              <CheckCircle2 size={12} /> {isVerified ? "Verified" : "Pending Verification"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-12 h-[1px] bg-gray-100 mx-4 md:mx-10" />

      <div className="max-w-2xl mx-auto mt-8 md:mt-10 space-y-4 px-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="text-[#3FAE2A]" size={18} />
            <h2 className="font-bold text-gray-800">Subscription Status</h2>
          </div>

          {subscription ? (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 border border-emerald-100">
                <span className="text-gray-500 flex items-center gap-2"><BadgeCheck size={15} /> Plan</span>
                <span className="font-semibold text-gray-800">{subscription.planName || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 border border-emerald-100">
                <span className="text-gray-500 flex items-center gap-2"><Clock3 size={15} /> Status</span>
                <Badge className={hasActiveSubscription ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                  {hasActiveSubscription ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 border border-emerald-100">
                <span className="text-gray-500 flex items-center gap-2"><CalendarDays size={15} /> Remaining</span>
                <span className="font-semibold text-gray-800">{subscription.remainingDays ?? 0} day(s)</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 border border-emerald-100">
                <span className="text-gray-500">Effective slots</span>
                <span className="font-semibold text-gray-800">{subscription.effectiveSlotsAvailable ?? subscription.slotsAvailable ?? "N/A"}</span>
              </div>
              <p className="text-xs text-emerald-900/80">
                {subscription.expiryDate
                  ? `Expires on ${new Date(subscription.expiryDate).toLocaleDateString()}`
                  : "No expiry date available"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white px-4 py-3 border border-emerald-100 text-sm text-gray-600">
              No subscription assigned yet.
            </div>
          )}
        </div>

        <ProfileListItem
          icon={<User className="text-white" size={18} />}
          label="Professional Details"
          onClick={() => router.push("/company/profile/profile-details")}
        />
        <ProfileListItem
          icon={<Crown className="text-white" size={18} />}
          label="Subscription"
          onClick={() => router.push("/company/jobs/subcription")}
        />
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
