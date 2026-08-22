"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployerPendingApproval() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">
        
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Meeting" fill className="object-cover" priority />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-2xl font-bold">Welcome to HireHubJA</h3>
            <p className="text-sm opacity-90 mt-1">Registration Complete!</p>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full transition-all bg-[#3FAE2A]" />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col p-6 md:p-12 relative overflow-y-auto custom-scrollbar">
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
            
            <div className="w-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-4 py-10">
              <div className="mb-8 relative">
                {/* Custom Clock Icon Wrapper */}
                <div className="w-24 h-24 rounded-full border-[5px] border-[#3FAE2A] flex items-center justify-center bg-transparent">
                   <Clock className="w-12 h-12 text-[#3FAE2A]" strokeWidth={2.5} />
                </div>
                {/* Animated Arrow element */}
                <div className="absolute top-0 right-0 w-7 h-7 bg-[#3FAE2A] text-white rounded-full border-[3px] border-[#EAF6EA] flex items-center justify-center translate-x-1 -translate-y-1">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-[#0D1E32] mb-3">Account Pending Approval</h2>
              
              <p className="text-sm text-[#64748B] mb-1">
                Your account is currently under review by the admin.
              </p>
              <p className="text-sm text-[#64748B] max-w-xs leading-relaxed">
                You will be able to access your dashboard once your account is approved.
              </p>

              <div className="pt-12 w-full max-w-[250px]">
                <Button 
                  className="w-full h-14 bg-[#3FAE2A] hover:bg-[#359624] rounded-full text-lg font-bold shadow-lg shadow-green-200/50 text-white"
                  onClick={() => router.push("/auth/signin")}
                >
                  Okay
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
