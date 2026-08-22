"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { login, setTempToken } from "@/redux/authSlice";
import { useVerifyOtpMutation, useResendOtpMutation } from "@/redux/services/authApi";

const OTP_LENGTH = 6;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  useEffect(() => {
    const fromQuery = searchParams.get("email");
    const fromStorage = sessionStorage.getItem("pending_verify_email");
    setEmail(fromQuery || fromStorage || "");
    if (!fromQuery && !fromStorage) {
      setError("Email is missing. Please sign in again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (seconds <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
  };

  const handleConfirm = async () => {
    setError("");
    const otpCode = otp.join("");
    if (otpCode.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    if (!email) {
      setError("Email is missing. Please sign in again.");
      return;
    }

    try {
      const data = await verifyOtp({ otp: otpCode, email }).unwrap();
      if (data?.tempToken) {
        dispatch(setTempToken(data.tempToken));
      }
      sessionStorage.removeItem("pending_verify_email");
      if (data?.token && data?.user) {
        dispatch(login({ user: data.user, token: data.token }));
      }
      router.push("/auth/signin");
    } catch (err: any) {
      setError(err?.data?.message || "Invalid OTP. Please try again.");
    }
  };

  const handleResend = async () => {
    setError("");
    if (!email) {
      setError("Email is missing. Cannot resend OTP.");
      return;
    }

    try {
      await resendOtp({ email }).unwrap();
      setSeconds(60);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(""));
    } catch (err: any) {
      setError(err?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Office" fill className="object-cover" priority />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-lg font-bold">Welcome to HireHubJA</h3>
            <p className="text-sm opacity-90 mt-1">Verify your email to continue</p>
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col justify-center p-8 md:px-16 py-12 relative overflow-y-auto max-h-[900px]">
          <button onClick={() => router.back()} className="absolute top-8 left-8 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition z-10">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          <div className="flex flex-col items-center w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-4 px-2">
            <h1 className="text-2xl font-bold text-[#3FAE2A] text-center mb-3">Verify your email</h1>
            <p className="text-gray-500 text-sm text-center mb-1 leading-relaxed">
              We've sent a verification code to <br />
              <span className="font-semibold text-gray-700">{email || "your email"}</span>
            </p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm w-full rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3 mb-4 mt-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white outline-none transition-all duration-150 shadow-sm ${digit ? "border-[#3FAE2A] text-black" : "border-gray-200 text-gray-700"} focus:border-[#3FAE2A]`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center w-full mb-8 text-sm">
              <span className="text-gray-500">Didn't get the code?</span>
              {canResend ? (
                <button onClick={handleResend} disabled={isResending} className="text-[#3FAE2A] font-semibold hover:underline disabled:opacity-50">
                  {isResending ? "Sending..." : "Resend"}
                </button>
              ) : (
                <span className="text-[#3FAE2A] font-semibold">00:{String(seconds).padStart(2, "0")}</span>
              )}
            </div>

            <Button onClick={handleConfirm} disabled={isVerifying} className="w-full bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold rounded-full py-6 shadow-lg shadow-green-100">
              {isVerifying ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Confirm Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
