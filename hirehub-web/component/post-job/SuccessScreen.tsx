"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-[400px] mb-6">
        <Image
          src="/image/confirmation-screen.svg" 
          alt="Success Illustration"
          width={400}
          height={300}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
      {/* 3. Okay Button */}
      <Button
        onClick={() => router.push("/")}
        className="w-full max-w-[280px] h-12 bg-[#3FAE2A] hover:bg-green-700 text-white font-bold rounded-full text-base shadow-lg shadow-green-100 transition-all"
      >
        Okay
      </Button>
    </div>
  );
}