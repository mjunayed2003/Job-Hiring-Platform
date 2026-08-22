"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crown, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetActiveSubscriptionQuery,
  useGetSubscriptionPlansQuery,
} from "@/redux/services/employerApi";

type FilterType = "active" | "available";

type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  duration: number;
  slotsAvailable?: string | number;
  features?: string[] | string;
};

type ActiveSubscription = {
  planName: string;
  price: number;
  duration: number;
  startDate: string;
  expiryDate: string;
  slotsAvailable?: string | number;
  features?: string[];
  remainingDays: number;
};

const normalizeFeatures = (features: SubscriptionPlan["features"]) => {
  if (Array.isArray(features)) return features.filter(Boolean);
  if (typeof features === "string") {
    return features
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const formatDate = (dateValue?: string) => {
  if (!dateValue) return "N/A";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function SubscriptionManagementPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  // ✅ FIX: Track which plan is currently navigating to prevent double-click
  const [navigatingPlanId, setNavigatingPlanId] = useState<string | null>(null);

  const {
    data: activeSub,
    isLoading: activeLoading,
    isError: activeError,
  } = useGetActiveSubscriptionQuery();

  const {
    data: availablePlans = [],
    isLoading: plansLoading,
    isError: plansError,
  } = useGetSubscriptionPlansQuery();

  const currentSub = (activeSub ?? null) as ActiveSubscription | null;
  const plans = (availablePlans ?? []) as SubscriptionPlan[];
  const hasActiveSubscription =
    Boolean(currentSub?.planName) && Number(currentSub?.remainingDays ?? 0) > 0;
  const effectiveFilter: FilterType =
    !activeLoading && !hasActiveSubscription ? "available" : activeFilter;

  const progressPercent =
    hasActiveSubscription && currentSub
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((currentSub.remainingDays / currentSub.duration) * 100)
          )
        )
      : 0;

  // ✅ FIX: async handler with guard to prevent repeated navigation calls
  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    const isCurrentActivePlan =
      hasActiveSubscription && currentSub?.planName === plan.name;

    if (isCurrentActivePlan) {
      setActiveFilter("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Prevent double-click / re-entrant calls
    if (navigatingPlanId === plan.id) return;

    setNavigatingPlanId(plan.id);

    try {
      await router.push(
        `/company/jobs/subcription/progress?planId=${encodeURIComponent(plan.id)}`
      );
    } finally {
      // Reset so button is usable again if navigation fails or user comes back
      setNavigatingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">
          Subscription Management
        </h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-5 pt-5 pb-1">
        <button
          onClick={() => setActiveFilter("active")}
          className={`px-5 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200 ${
            effectiveFilter === "active"
              ? "bg-[#3FAE2A] text-white border-[#3FAE2A] shadow-sm"
              : "bg-white text-gray-500 border-gray-200 hover:border-[#3FAE2A] hover:text-[#3FAE2A]"
          }`}
        >
          Active Subscription
        </button>
        <button
          onClick={() => setActiveFilter("available")}
          className={`px-5 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200 ${
            effectiveFilter === "available"
              ? "bg-[#3FAE2A] text-white border-[#3FAE2A] shadow-sm"
              : "bg-white text-gray-500 border-gray-200 hover:border-[#3FAE2A] hover:text-[#3FAE2A]"
          }`}
        >
          Available Plans
        </button>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* ── ACTIVE SUBSCRIPTION ── */}
        {effectiveFilter === "active" && (
          <div className="space-y-4">
            <p className="text-[15px] font-bold text-gray-800">
              Active Subscription
            </p>

            {activeLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#3FAE2A]" size={28} />
              </div>
            ) : activeError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                Failed to load active subscription.
              </div>
            ) : !hasActiveSubscription || !currentSub ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center space-y-4">
                <p className="text-sm text-gray-600">
                  No active subscription found.
                </p>
                <Button
                  onClick={() => setActiveFilter("available")}
                  className="bg-[#3FAE2A] hover:bg-[#359624] text-white h-11 rounded-full text-[13px] font-bold px-6"
                >
                  View Available Plans
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-green-100 bg-[#F6FDF5] overflow-hidden">
                  <div className="flex items-center justify-center gap-2 py-3 bg-[#EAF6EA]">
                    <Crown size={16} className="text-[#3FAE2A]" />
                    <span className="text-[14px] font-bold text-[#3FAE2A] tracking-wide uppercase">
                      {currentSub.planName}
                    </span>
                  </div>

                  <div className="mx-4 my-4 bg-white rounded-xl p-4 border border-green-50">
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 shrink-0">
                        <svg
                          viewBox="0 0 56 56"
                          className="w-full h-full -rotate-90"
                        >
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="5"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="22"
                            fill="none"
                            stroke="#3FAE2A"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 22 * (1 - progressPercent / 100)
                            }`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#3FAE2A]">
                          {progressPercent}%
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-2xl font-extrabold text-gray-900">
                            {currentSub.remainingDays}
                          </span>
                          <span className="text-[12px] text-gray-400 font-medium">
                            Days Remaining
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3FAE2A] rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 space-y-2">
                    {[
                      { label: "Plan Name", value: currentSub.planName },
                      { label: "Price", value: `$${currentSub.price}` },
                      {
                        label: "Duration",
                        value: `${currentSub.duration} Days`,
                      },
                      {
                        label: "Start Date",
                        value: formatDate(currentSub.startDate),
                      },
                      {
                        label: "Expiry Date",
                        value: formatDate(currentSub.expiryDate),
                      },
                      {
                        label: "Slots Available",
                        value: String(currentSub.slotsAvailable ?? "N/A"),
                      },
                      {
                        label: "Remaining Days",
                        value: `${currentSub.remainingDays}`,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <span className="text-[#3FAE2A] font-semibold min-w-[130px]">
                          {item.label}:
                        </span>
                        <span className="text-gray-700">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setActiveFilter("available")}
                  className="w-full bg-[#3FAE2A] hover:bg-[#359624] text-white h-12 rounded-full text-[14px] font-bold gap-2 shadow-md shadow-green-100"
                >
                  <Crown size={16} />
                  Upgrade Plan
                </Button>
              </>
            )}
          </div>
        )}

        {/* ── AVAILABLE PLANS ── */}
        {effectiveFilter === "available" && (
          <div className="space-y-4">
            <p className="text-[15px] font-bold text-gray-800">
              Available Subscription Plans
            </p>

            {plansLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#3FAE2A]" size={28} />
              </div>
            ) : plansError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                Failed to load subscription plans.
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                No subscription plans are available right now.
              </div>
            ) : (
              plans.map((plan, index) => {
                const features = normalizeFeatures(plan.features);
                const isPopular = index === 1;
                const isActivePlan =
                  hasActiveSubscription && currentSub?.planName === plan.name;
                // ✅ FIX: Check if this specific plan is navigating
                const isNavigating = navigatingPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 border-[#3FAE2A] ${
                      isActivePlan
                        ? "shadow-md shadow-green-100 ring-2 ring-[#3FAE2A]/30 bg-[#F6FDF5]"
                        : "shadow-md shadow-green-50 bg-[#F6FDF5]"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-[#EAF6EA]">
                      <Crown size={14} className="text-[#3FAE2A]" />
                      <span className="text-[13px] font-bold tracking-wider uppercase text-[#3FAE2A]">
                        {plan.name}
                      </span>
                      {isActivePlan && (
                        <Badge className="bg-emerald-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full ml-1">
                          ✓ ACTIVE
                        </Badge>
                      )}
                      {isPopular && !isActivePlan && (
                        <Badge className="bg-[#3FAE2A] text-white text-[9px] px-2 py-0.5 rounded-full ml-1">
                          POPULAR
                        </Badge>
                      )}
                    </div>

                    {isActivePlan && (
                      <div className="mx-4 my-3 bg-white rounded-xl p-4 border border-green-50">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 shrink-0">
                            <svg
                              viewBox="0 0 56 56"
                              className="w-full h-full -rotate-90"
                            >
                              <circle
                                cx="28"
                                cy="28"
                                r="22"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="5"
                              />
                              <circle
                                cx="28"
                                cy="28"
                                r="22"
                                fill="none"
                                stroke="#3FAE2A"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 22}`}
                                strokeDashoffset={`${
                                  2 *
                                  Math.PI *
                                  22 *
                                  (1 - progressPercent / 100)
                                }`}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#3FAE2A]">
                              {progressPercent}%
                            </span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="text-xl font-extrabold text-gray-900">
                                {currentSub!.remainingDays}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium">
                                Days Remaining
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#3FAE2A]"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Expires: {formatDate(currentSub!.expiryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="px-4 pt-3 pb-3 space-y-2">
                      {!isActivePlan && (
                        <>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-[14px] font-bold text-gray-900">
                              JMD {plan.price}
                            </span>
                            <span className="text-[12px] text-gray-500">
                              {plan.duration} Days
                            </span>
                          </div>
                        </>
                      )}
                      {isActivePlan &&
                        [
                          { label: "Plan Name", value: plan.name },
                          {
                            label: "Price",
                            value: `JMD ${currentSub!.price}`,
                          },
                          {
                            label: "Duration",
                            value: `${currentSub!.duration} Days`,
                          },
                          {
                            label: "Slots Available",
                            value: String(
                              currentSub!.slotsAvailable ?? "N/A"
                            ),
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <span className="text-[#3FAE2A] font-semibold min-w-[110px]">
                              {item.label}:
                            </span>
                            <span className="text-gray-600">{item.value}</span>
                          </div>
                        ))}

                      <div>
                        {!isActivePlan && features.length > 0 && (
                          <div className="pt-1">
                            <p className="text-[12px] text-[#3FAE2A] font-semibold mb-2">
                              Features:
                            </p>
                            <ul className="space-y-1">
                              {features.map((f, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center gap-2 text-[11px] text-gray-600"
                                >
                                  <CheckCircle2
                                    size={12}
                                    className="text-[#3FAE2A] shrink-0"
                                  />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {isActivePlan && features.length > 0 && (
                          <div className="pt-1">
                            <p className="text-[12px] text-[#3FAE2A] font-semibold mb-1">
                              Features:
                            </p>
                            <ul className="space-y-1">
                              {features.map((f, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center gap-2 text-[11px] text-gray-600"
                                >
                                  <CheckCircle2
                                    size={12}
                                    className="text-[#3FAE2A] shrink-0"
                                  />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-4">
                      {/* ✅ FIX: Button disabled + shows spinner while navigating */}
                      <Button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isNavigating}
                        className={`w-full h-11 rounded-full text-[13px] font-bold gap-2 ${
                          isActivePlan
                            ? "bg-emerald-600 text-white hover:bg-emerald-600 opacity-90"
                            : "bg-white border-2 border-[#3FAE2A] text-[#3FAE2A] hover:bg-[#EAF6EA]"
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                      >
                        {isNavigating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isActivePlan ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Crown size={14} />
                        )}
                        {isNavigating
                          ? "Loading..."
                          : isActivePlan
                          ? "Current Active Plan"
                          : "Select Plan"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
