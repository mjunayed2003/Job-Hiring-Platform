"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { login } from "@/redux/authSlice";
import { useVerifyOtpMutation, useResendOtpMutation } from "@/redux/services/authApi";

export default function EmployerStep2OTP() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const OTP_LENGTH = 6;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [userEmail, setUserEmail] = useState<string>("");

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  // ✅ Read email from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const email = sessionStorage.getItem("signup_email");
      if (email) {
        setUserEmail(email);
      } else {
        setError("Email not found. Please go back and start again.");
      }
    }
  }, []);

  // ✅ Countdown timer
  useEffect(() => {
    if (seconds <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    setError("");
    const otpCode = otp.join("");

    if (otpCode.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    if (!userEmail) {
      setError("Email is missing. Please restart registration.");
      return;
    }

    try {
      // ✅ Verify OTP
      const data = await verifyOtp({ otp: otpCode, email: userEmail }).unwrap();

      if (data?.token) {
        // ✅ Save main token to Redux store
        dispatch(
          login({
            user: data.user ?? { id: "", name: "", email: userEmail, role: "EMPLOYER" },
            token: data.token,
          })
        );

        // ✅ Save main token + role to cookie
        const maxAge = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `auth-token=${data.token}; path=/; max-age=${maxAge}`;
        document.cookie = `user-role=EMPLOYER; path=/; max-age=${maxAge}`;
      }

      // ✅ Clean up sessionStorage
      sessionStorage.removeItem("signup_email");

      router.push("/auth/signup/employer/step-3");
    } catch (err: any) {
      setError(err?.data?.message || "Invalid OTP. Please try again.");
    }
  };

  const handleResend = async () => {
    setError("");
    if (!userEmail) {
      setError("Email is missing. Cannot resend OTP.");
      return;
    }

    try {
      // ✅ Resend OTP
      await resendOtp({ email: userEmail }).unwrap();
      setSeconds(60);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to resend OTP.");
    }
  };

  const handlePaste = (e: React.ClipboardEvent, idx: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedData) return;

    const next = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (idx + i < OTP_LENGTH) next[idx + i] = char;
    });
    setOtp(next);

    //  filled box  focus 
    const lastIdx = Math.min(idx + pastedData.length - 1, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">

        {/* Left Side */}
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Meeting" fill className="object-cover" priority />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-2xl font-bold">Welcome to HireHubJA</h3>
            <p className="text-sm opacity-90 mt-1">Login to explore more</p>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === 2 ? "bg-[#3FAE2A] ring-2 ring-green-900/50 w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col justify-center p-6 md:p-12 relative overflow-y-auto">
          <Button variant="ghost" size="icon" className="absolute top-8 left-8 rounded-full bg-white shadow-sm hover:bg-gray-100 z-10" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>

          <div className="flex flex-col items-center w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-4 px-2">
            <h1 className="text-2xl font-bold text-[#3FAE2A] text-center mb-3">Verify your email</h1>
            <p className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
              We&apos;ve sent a mail with an activation code to <br />
              <span className="font-semibold text-gray-700">{userEmail}</span>
            </p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm w-full rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3 mb-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={(e) => handlePaste(e, idx)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white outline-none transition-all duration-150 shadow-sm ${digit ? "border-[#3FAE2A] text-black" : "border-gray-200 text-gray-700"} focus:border-[#3FAE2A]`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center w-full mb-8 text-sm">
              <span className="text-gray-500">Didn&apos;t get the code?</span>
              {canResend ? (
                <button onClick={handleResend} disabled={isResending} className="text-[#3FAE2A] font-semibold hover:underline disabled:opacity-50">
                  {isResending ? "Sending..." : "Resend"}
                </button>
              ) : (
                <span className="text-[#3FAE2A] font-semibold">00:{String(seconds).padStart(2, '0')}</span>
              )}
            </div>

            <Button onClick={handleConfirm} disabled={isVerifying} className="w-full h-12 bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold rounded-full shadow-lg shadow-green-200/50 text-lg">
              {isVerifying ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Confirm Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
