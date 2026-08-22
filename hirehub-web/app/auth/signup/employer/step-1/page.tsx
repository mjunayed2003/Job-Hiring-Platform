"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRegisterMutation } from "@/redux/services/authApi";

export default function EmployerStep1() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const [register, { isLoading }] = useRegisterMutation();

  const handleNext = async () => {
    setError("");

    if (!fullName || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Use and Privacy Policy.");
      return;
    }

    try {
      // ✅ Register call with EMPLOYER role
      await register({
        fullName,
        email,
        password,
        role: "EMPLOYER", // ব্যাকএন্ডের রিকোয়ারমেন্ট অনুযায়ী রোল ঠিক করে নিবেন
      }).unwrap();

      // ✅ Saving email for Step-2 OTP verification
      sessionStorage.setItem("signup_email", email);

      router.push("/auth/signup/employer/step-2");
    } catch (err: any) {
      setError(err?.data?.message || "Registration failed. Please try again.");
    }
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
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === 1 ? "bg-[#3FAE2A] ring-2 ring-green-900/50 w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col p-6 md:p-12 relative overflow-y-auto custom-scrollbar">
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex flex-col items-center mb-6">
                <Image src="/image/logo.svg" alt="LOGO" width={150} height={150} />
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#3FAE2A]">Create An Account as<br />Employer</h1>
                <p className="text-gray-500 text-sm mt-2">Fill in your information.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm w-full rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-gray-600 font-medium">Employer Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your employer full name" className="h-12 bg-white border-none shadow-sm rounded-xl focus-visible:ring-[#3FAE2A]" />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-600 font-medium">Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter your Email" className="h-12 bg-white border-none shadow-sm rounded-xl focus-visible:ring-[#3FAE2A]" />
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-600 font-medium">Password</Label>
                  <div className="relative">
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPass ? "text" : "password"} placeholder="Enter your Password" className="h-12 bg-white border-none shadow-sm pr-10 rounded-xl focus-visible:ring-[#3FAE2A]" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      type={showConfirm ? "text" : "password"} 
                      placeholder="Confirm your Password"
                      className="rounded-xl bg-white border-none py-6 pr-10 shadow-sm focus-visible:ring-[#3FAE2A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />} 
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="data-[state=checked]:bg-[#3FAE2A] data-[state=checked]:border-[#3FAE2A] border-gray-400" />
                  <label htmlFor="terms" className="text-xs text-gray-500 font-medium cursor-pointer">
                    I agree with this <span className="text-[#3FAE2A] font-bold">Terms of Use</span> and <span className="text-[#3FAE2A] font-bold">Privacy Policy</span>.
                  </label>
                </div>

                <Button onClick={handleNext} disabled={isLoading || !agreed} className="w-full h-12 bg-[#3FAE2A] hover:bg-[#359624] rounded-full text-lg font-bold shadow-lg shadow-green-200/50 mt-4 text-white">
                  {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Sign Up
                </Button>

                <p className="text-center text-sm text-gray-500 font-medium mt-4">
                  Already have an account? <Link href="/auth/signin" className="text-[#3FAE2A] cursor-pointer hover:underline">Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
