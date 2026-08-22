"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CardVerifyConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <CheckCircle2 className="w-24 h-24 text-[#4CB82F]" />
          ) : (
            <XCircle className="w-24 h-24 text-red-500" />
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          {isSuccess ? "Card Verified!" : "Verification Failed"}
        </h1>
        
        <p className="text-gray-600 text-lg">
          {isSuccess 
            ? "Your card has been successfully verified. You can now proceed with making payments." 
            : "We couldn't verify your card. The amount entered may be incorrect, or the verification session has expired."}
        </p>

        <div className="pt-8 space-y-4">
          <Button
            onClick={() => router.push(isSuccess ? "/employer/jobs" : "/employer/card-verify")}
            className="w-full rounded-full bg-[#4CB82F] py-6 text-lg font-semibold text-white shadow-lg shadow-green-200 hover:bg-[#3ea327]"
          >
            {isSuccess ? "Continue to Jobs" : "Try Again"}
          </Button>
          
          {!isSuccess && (
            <Button
              variant="outline"
              onClick={() => router.push("/employer/jobs")}
              className="w-full rounded-full py-6 text-lg font-semibold"
            >
              Return to Jobs
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
