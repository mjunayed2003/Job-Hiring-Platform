"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useInitiateCardVerificationMutation,
  useConfirmCardVerificationMutation,
} from "@/redux/services/featuresApi";

export default function CardVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const [initiateVerification, { isLoading: isInitiating }] = useInitiateCardVerificationMutation();
  const [confirmVerification, { isLoading: isConfirming }] = useConfirmCardVerificationMutation();

  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  // ← এটাই fix — একবারের বেশি call হবে না
  const hasCalled = useRef(false);

  useEffect(() => {
    if (status || hasCalled.current) return;
    hasCalled.current = true;

    const startVerification = async () => {
      try {
        const response = await initiateVerification().unwrap();
        const redirectData = response?.redirectData || response?.redirect;
        if (redirectData) {
          const popup = window.open("", "_self");
          if (popup?.document) {
            popup.document.open();
            popup.document.write(redirectData);
            popup.document.close();
          } else {
            document.open();
            document.write(redirectData);
            document.close();
          }
        } else {
          setError("Failed to initiate verification. No redirect data received.");
        }
      } catch (err: any) {
        console.error("Failed to initiate card verification:", err);
        setError(err?.data?.message || "An error occurred while initiating card verification.");
      }
    };

    startVerification();
  }, [status]); // ← initiateVerification dependency সরিয়ে দিলাম

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setError("");
      await confirmVerification({ amount: Number(amount) }).unwrap();
      router.push("/employer/card-verify/confirm?success=true");
    } catch (err: any) {
      console.error("Failed to confirm card verification:", err);
      setError(err?.data?.message || "Failed to confirm. Please check the amount and try again.");
      router.push("/employer/card-verify/confirm?success=false");
    }
  };

  if (!status && isInitiating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3FAE2A] border-t-transparent mb-4" />
          <p className="text-gray-600">Initiating Card Verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center">
      {/* Header */}
      <div className="mx-auto w-full max-w-[1390px] px-6 py-6 md:px-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0 rounded-full border border-gray-200 bg-white hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl lg:text-3xl">
            Card Verification
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[800px] px-6 pb-12 md:px-10 mt-10">
        {error && !status && (
          <div className="rounded-xl bg-red-50 p-6 text-red-600 mb-8 border border-red-100">
            <h3 className="font-semibold mb-2">Error</h3>
            <p>{error}</p>
          </div>
        )}

        {status === "pending" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Verify Your Card</h2>
              <p className="text-gray-600">
                A small amount has been charged to your card. Please check your bank statement
                or SMS alerts and enter the exact amount below to verify your card.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleConfirm} className="space-y-6 max-w-sm mx-auto">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Charged
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    JMD
                  </span>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-12 pr-4 py-3 focus:border-[#4CB82F] focus:outline-none focus:ring-1 focus:ring-[#4CB82F]"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isConfirming}
                className="w-full rounded-full bg-[#4CB82F] py-6 text-lg font-semibold text-white shadow-lg shadow-green-200 hover:bg-[#3ea327] disabled:opacity-60"
              >
                {isConfirming ? "Verifying..." : "Confirm Amount"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}