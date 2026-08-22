"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleOkay = () => {
    router.replace("/company/jobs/subcription");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F4F4] to-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button
            onClick={() => router.replace("/company/jobs/subcription")}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-gray-800 tracking-tight">
            Payment Confirmation
          </h1>
        </div>

        <div className="px-6 py-10 text-center">
          <div
            className={`mx-auto mb-6 transition-all duration-700 ease-out ${
              visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
            }`}
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#F0FDF4] ring-1 ring-[#D8F3D4]">
              <Image
                src="/image/powertanz.png"
                alt="Payment Received Successfully"
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>

          <div className={`transition-all duration-700 delay-150 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-[15px] font-bold text-gray-900">
              Payment Received Successfully.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Your subscription payment was completed. You can continue managing your plan.
            </p>
          </div>

          <div className={`mt-8 transition-all duration-700 delay-300 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <button
              onClick={handleOkay}
              className="w-full rounded-full bg-[#3FAE2A] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#359624] active:scale-[0.99]"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}