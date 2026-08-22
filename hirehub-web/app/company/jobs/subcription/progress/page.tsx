"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useCreateSubscriptionPaymentUrlMutation,
  useGetSubscriptionPlansQuery,
  useGetActiveSubscriptionQuery,
} from "@/redux/services/employerApi";

type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  duration: number;
  slotsAvailable?: string | number;
  features?: string[] | string;
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

const extractRedirectData = (response: unknown): string | undefined => {
  if (typeof response === "string") return response;
  if (!response || typeof response !== "object") return undefined;

  const payload = response as Record<string, unknown>;

  // Check all common redirect/html/url fields
  const candidates = [
    payload.redirectData,
    payload.html,
    payload.redirectUrl,
    payload.url,
    payload.paymentUrl,
    payload.checkoutUrl,
    typeof payload.data === "string" ? payload.data : (payload.data as Record<string, unknown>)?.redirectData,
    typeof payload.result === "string" ? payload.result : (payload.result as Record<string, unknown>)?.redirectData,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c;
  }

  return undefined;
};

export default function SubscriptionProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");

  const { data: activeSub, isLoading: activeLoading } = useGetActiveSubscriptionQuery();
  const { data: availablePlans = [], isLoading, isError } = useGetSubscriptionPlansQuery();
  const [createSubscriptionPaymentUrl, { isLoading: isCreatingPayment }] =
    useCreateSubscriptionPaymentUrlMutation();

  const plans = (availablePlans ?? []) as SubscriptionPlan[];
  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;
  const features = normalizeFeatures(selectedPlan?.features);
  const currentActive = (activeSub ?? null) as {
    planName?: string;
    remainingDays?: number;
    price?: number | string;
  } | null;
  const hasActiveSubscription =
    Boolean(currentActive?.planName) && Number(currentActive?.remainingDays ?? 0) > 0;
  const activeName = String(currentActive?.planName ?? "").trim().toLowerCase();
  const selectedName = String(selectedPlan?.name ?? "").trim().toLowerCase();
  const nameMatches = Boolean(
    activeName &&
      selectedName &&
      (activeName === selectedName ||
        activeName.includes(selectedName) ||
        selectedName.includes(activeName))
  );
  const priceMatches =
    typeof currentActive?.price !== "undefined" &&
    typeof selectedPlan?.price !== "undefined" &&
    Number(currentActive.price) === Number(selectedPlan.price);
  const isAlreadyActivePlan = Boolean(
    selectedPlan && hasActiveSubscription && (nameMatches || priceMatches)
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!activeLoading && isAlreadyActivePlan) {
      window.location.assign("/company/jobs/subcription");
    }
  }, [activeLoading, isAlreadyActivePlan]);

  const handleStartPayment = async () => {
    if (!selectedPlan) return;
    if (activeLoading || isAlreadyActivePlan) {
      window.location.assign("/company/jobs/subcription");
      return;
    }

    setErrorMessage(null);

    try {
      const paymentResponse = await createSubscriptionPaymentUrl({
        planId: selectedPlan.id,
      }).unwrap();

      // ── Case 1: Response has a redirect URL / HTML → open payment gateway ──
      const redirectData = extractRedirectData(paymentResponse);
      if (redirectData) {
        const popup = window.open("", "_self");
        if (popup?.document) {
          popup.document.open();
          popup.document.write(redirectData);
          popup.document.close();
          return;
        }
        document.open();
        document.write(redirectData);
        document.close();
        return;
      }

      // ── Case 2: Response has isActive:true → subscription created directly ──
      const res = paymentResponse as Record<string, unknown>;
      if (res?.isActive === true || res?.isActive === "true") {
        window.location.assign("/company/jobs/subcription");
        return;
      }

      // ── Case 3: Response has nested plan with isActive ──
      const nested = res?.plan as Record<string, unknown> | undefined;
      if (nested?.isActive === true) {
        window.location.assign("/company/jobs/subcription");
        return;
      }

      // ── Fallback: unknown response shape ──
      console.warn("Unhandled payment response shape:", paymentResponse);
      setErrorMessage("Unexpected response from server. Please contact support.");
    } catch (error: unknown) {
      const apiMessage =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;

      const normalizedMessage = String(apiMessage ?? "").toLowerCase();

      if (
        normalizedMessage.includes("active subscription") ||
        normalizedMessage.includes("already have an active subscription")
      ) {
        window.location.assign("/company/jobs/subcription");
        return;
      }

      setErrorMessage(apiMessage ?? "Failed to start payment. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5fff2_0%,_#ffffff_52%,_#f7faf7_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
        <div className="flex items-center gap-3 pb-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0 rounded-full border border-gray-200 bg-white hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Confirm Subscription</h1>
            <p className="text-sm text-gray-500">
              Review details while we prepare the payment page.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-xl shadow-green-50">
          <div className="flex items-center justify-center gap-2 bg-[#EAF6EA] px-4 py-3">
            <Crown size={16} className="text-[#3FAE2A]" />
            <span className="text-[13px] font-bold uppercase tracking-wider text-[#3FAE2A]">
              PowerTanz Payment
            </span>
          </div>

          <div className="px-5 py-6 md:px-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="relative h-[92px] w-[190px]">
                <Image
                  src="/image/powertanz.png"
                  alt="PowerTanz payment"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-700">
                Review your plan and continue with payment.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Click the button below to open the secure PowerTanz payment page.
              </p>
            </div>

            {!planId ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                Missing subscription plan.
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#3FAE2A]" size={28} />
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                Failed to load subscription plans.
              </div>
            ) : !selectedPlan ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                Selected plan was not found.
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-green-50 bg-[#F6FDF5] p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{selectedPlan.name}</p>
                      <p className="text-xs text-gray-500">Subscription plan summary</p>
                    </div>
                    <Badge className="rounded-full bg-[#3FAE2A] px-2 py-0.5 text-[9px] text-white">
                      SELECTED
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Price</span>
                      <span className="font-semibold text-gray-900">JMD {selectedPlan.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-semibold text-gray-900">
                        {selectedPlan.duration} Days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Slots Available</span>
                      <span className="font-semibold text-gray-900">
                        {String(selectedPlan.slotsAvailable ?? "N/A")}
                      </span>
                    </div>
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[12px] font-semibold text-[#3FAE2A]">Features</p>
                    <ul className="mt-2 space-y-1.5">
                      {features.slice(0, 4).map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-[12px] text-gray-600"
                        >
                          <CheckCircle2 size={12} className="shrink-0 text-[#3FAE2A]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
                  <Button
                    onClick={handleStartPayment}
                    disabled={isCreatingPayment || activeLoading || isAlreadyActivePlan}
                    className="h-12 w-full gap-2 rounded-full bg-[#3FAE2A] text-[14px] font-bold text-white shadow-md shadow-green-100 hover:bg-[#359624] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCreatingPayment || activeLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Crown size={16} />
                    )}
                    {activeLoading
                      ? "Checking Subscription..."
                      : isCreatingPayment
                      ? "Processing..."
                      : isAlreadyActivePlan
                      ? "Already Active"
                      : "Proceed to Payment"}
                  </Button>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => router.push("/company/jobs/subcription")}
                    variant="outline"
                    className="h-11 flex-1 rounded-full border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Back to Plans
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}