"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setTempToken } from "@/redux/authSlice";
import {
  useForgotPasswordMutation,
  useForgotPasswordVerifyOtpMutation,
  useForgotPasswordResendOtpMutation,
  useResetPasswordMutation,
} from "@/redux/services/authApi";

export default function ForgotPasswordFlow() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [flowTempToken, setFlowTempToken] = useState<string>("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [forgotPassword, { isLoading: isSendingEmail }] = useForgotPasswordMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useForgotPasswordVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useForgotPasswordResendOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  // ── OTP Helpers ──
  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── Back Button ──
  const handleBack = () => {
    setError("");
    setSuccessMsg("");
    if (step === 1) router.push("/auth/signin");
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  // ── Step 1: Email submit → tempToken save ──
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      const data = await forgotPassword({ email }).unwrap();
      const token = data?.tempToken ?? data?.data?.tempToken;
      if (token) setFlowTempToken(token);
      setStep(2);
    } catch (err: any) {
      setError(err?.data?.message || "Failed to send OTP. Try again.");
    }
  };


  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    try {
      const data = await verifyOtp({ otp: otpString, tempToken: flowTempToken }).unwrap();
      const token = data?.tempToken ?? data?.data?.tempToken;
      if (token) setFlowTempToken(token);
      setStep(3);
    } catch (err: any) {
      setError(err?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  // ── Step 2: OTP resend → নতুন tempToken save ──
  const handleResendOtp = async () => {
    setError("");
    setSuccessMsg("");
    try {
      const data = await resendOtp({ tempToken: flowTempToken }).unwrap();
      const token = data?.tempToken ?? data?.data?.tempToken;
      if (token) setFlowTempToken(token);
      setSuccessMsg("A new OTP has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to resend OTP.");
    }
  };

  // ── Step 3: Password reset ──
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      await resetPassword({ newPassword, confirmPassword, tempToken: flowTempToken }).unwrap();
      // Flow শেষ — Redux tempToken clear করা
      dispatch(setTempToken(null));
      setFlowTempToken("");
      router.push("/auth/signin");
    } catch (err: any) {
      setError(err?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">

        {/* LEFT: Static Image */}
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image
            src="/image/jaimica7.webp"
            alt="Office"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-lg font-bold">Welcome to HireHubJA</h3>
            <p className="text-sm opacity-90 mt-1">Login to explore more</p>
            <div className="flex justify-center gap-2 mt-3">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="w-2 h-2 bg-white/50 rounded-full" />
              <span className="w-2 h-2 bg-white/50 rounded-full" />
            </div>
          </div>
        </div>

        {/* RIGHT: Dynamic Steps */}
        <div className="w-full md:w-1/2 bg-[#EBFDF2] flex flex-col items-center justify-center p-8 md:p-12 relative">

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="absolute top-8 left-8 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Logo (Step 2 & 3) */}
          {step !== 1 && (
            <div className="mb-6">
              <Image
                src="/image/logo.svg"
                alt="Logo"
                width={140}
                height={80}
                className="object-contain"
              />
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm w-full max-w-md rounded">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 mb-4 text-sm w-full max-w-md rounded">
              {successMsg}
            </div>
          )}

          {/* ── STEP 1: Enter Email ── */}
          {step === 1 && (
            <div className="w-full max-w-md text-center animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3FAE2A] mb-2">Forgot Password</h1>
                <p className="text-gray-500 text-sm">
                  Please enter your email to reset your password.
                </p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-600 ml-1">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="rounded-xl bg-white border-transparent focus:ring-[#3FAE2A] py-6"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full bg-[#3FAE2A] hover:bg-[#369624] text-white font-bold rounded-full py-6 text-lg shadow-lg mt-4"
                >
                  {isSendingEmail
                    ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    : "Get Code"
                  }
                </Button>
              </form>
            </div>
          )}

          {/* ── STEP 2: Verify OTP ── */}
          {step === 2 && (
            <div className="w-full max-w-md text-center animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3FAE2A] mb-2">Verify</h1>
                <p className="text-gray-500 text-sm">
                  Enter the verification code sent to{" "}
                  <span className="font-semibold text-gray-700">{email}</span>
                </p>
              </div>
              <form onSubmit={handleOtpSubmit} className="space-y-8">
                <div className="flex justify-center gap-2 sm:gap-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className="w-10 h-10 sm:w-12 sm:h-12 text-center border border-gray-300 rounded-xl focus:border-[#3FAE2A] focus:ring-2 focus:ring-[#3FAE2A]/20 outline-none text-lg font-bold bg-white transition-all"
                    />
                  ))}
                </div>

                <p className="text-sm text-gray-500">
                  Didn&apos;t receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="text-[#3FAE2A] font-semibold hover:underline disabled:opacity-50"
                  >
                    {isResending ? "Resending..." : "Resend"}
                  </button>
                </p>

                <Button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full bg-[#3FAE2A] hover:bg-[#369624] text-white font-bold rounded-full py-6 text-lg shadow-lg"
                >
                  {isVerifyingOtp
                    ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    : "Verify"
                  }
                </Button>
              </form>
            </div>
          )}

          {/* ── STEP 3: Reset Password ── */}
          {step === 3 && (
            <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#3FAE2A] mb-2">Reset Password</h1>
                <p className="text-gray-500 text-xs">Password must have at least 6 characters.</p>
              </div>
              <form onSubmit={handleResetSubmit} className="space-y-5">

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 ml-1">
                    Create New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPass1 ? "text" : "password"}
                      placeholder="Enter your Password"
                      className="rounded-xl bg-white border-transparent focus:ring-[#3FAE2A] py-6 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass1(!showPass1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass1 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600 ml-1">
                    Enter Password Again
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPass2 ? "text" : "password"}
                      placeholder="Enter your Password"
                      className="rounded-xl bg-white border-transparent focus:ring-[#3FAE2A] py-6 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass2(!showPass2)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass2 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-[#3FAE2A] hover:bg-[#369624] text-white font-bold rounded-full py-6 text-lg shadow-lg mt-6"
                >
                  {isResetting
                    ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    : "Reset"
                  }
                </Button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
