"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingApproval() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        
        {/* LEFT SIDE */}
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Office" fill className="object-cover" priority />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-lg font-bold">Welcome to the <span className="underline decoration-2 underline-offset-4">HireHubJA</span></h3>
            <p className="text-sm opacity-90 mt-1">Registration Complete!</p>
            <div className="flex justify-center gap-2 mt-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full transition-all bg-[#3FAE2A]" />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (Pending Approval UI) */}
        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col items-center justify-center p-8 md:px-16 py-12 relative overflow-y-auto max-h-[900px]">
          
          <div className="max-w-md w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
            
            {/* Custom Icon (Clock with arrow badge) */}
            <div className="relative mb-8">
              {/* Main Green Circle */}
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-[5px] border-[#3FAE2A] flex items-center justify-center bg-transparent">
                <Clock className="w-12 h-12 md:w-14 md:h-14 text-[#3FAE2A]" strokeWidth={2.5} />
              </div>
              
              {/* Top-Right Arrow Badge */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#3FAE2A] rounded-full border-4 border-[#EAF6EA] flex items-center justify-center translate-x-1 -translate-y-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>

            {/* Typography */}
            <h2 className="text-2xl md:text-[26px] font-extrabold text-[#0D1E32] mb-4">
              Account Pending Approval
            </h2>
            
            <p className="text-[#64748B] text-sm leading-relaxed mb-10 max-w-[320px]">
              Your account is currently under review by the admin. You will be able to access your dashboard once your account is approved.
            </p>

            {/* Button */}
            <Button 
              onClick={() => router.push("/")}
              className="w-[80%] max-w-[300px] bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold rounded-full py-6 shadow-lg shadow-green-100 text-base"
            >
              Okay
            </Button>

          </div>
          
        </div>
      </div>
    </div>
  );
}
