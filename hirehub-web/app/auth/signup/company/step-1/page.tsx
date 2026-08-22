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

export default function CompanyStep1() {
    const router = useRouter();
    const [showPass, setShowPass] = useState(false);

    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState("");

    const [register, { isLoading }] = useRegisterMutation();

    const handleNext = async () => {
    setError("");

    if (!companyName || !email || !password || !confirm) {
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
        // ✅ এখানে এই line টা আছে:
        await register({
            fullName: companyName,  // fullName is required by API
            companyName: companyName,
            email,
            password,
            role: "COMPANY",
        }).unwrap();

        sessionStorage.setItem("signup_email", email);
        router.push("/auth/signup/company/step-2");
    } catch (err: any) {
        setError(err?.data?.message || "Registration failed. Please try again.");
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">

                {/* Left Side */}
                <div className="relative w-full md:w-1/2 hidden md:block">
                    <Image src="/image/jaimica7.webp" alt="Office" fill className="object-cover" priority />
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
                <div className="w-full md:w-1/2 flex flex-col p-6 md:p-12 relative overflow-y-auto custom-scrollbar bg-[#EAF6EA]">
                    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">

                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex flex-col items-center mb-6">
                                <Image src="/image/logo.svg" alt="LOGO" width={150} height={150} />
                            </div>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-[#3FAE2A]">Create An Account as Company</h2>
                                <p className="text-gray-500 mt-1 text-sm">Fill in your information.</p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm w-full rounded">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-gray-700 text-sm font-medium">Company Name</Label>
                                    <Input 
                                        value={companyName} 
                                        onChange={(e) => setCompanyName(e.target.value)} 
                                        placeholder="Enter your company name" 
                                        className="h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#3FAE2A]" 
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-gray-700 text-sm font-medium">Official Email</Label>
                                    <Input 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        type="email" 
                                        placeholder="Enter your email" 
                                        className="h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#3FAE2A]" 
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-gray-700 text-sm font-medium">Password</Label>
                                    <div className="relative">
                                        <Input 
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)} 
                                            type={showPass ? "text" : "password"} 
                                            placeholder="Enter your Password" 
                                            className="h-12 bg-white border border-gray-200 pr-10 rounded-xl focus-visible:ring-[#3FAE2A]" 
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-gray-700 text-sm font-medium">Confirm Password</Label>
                                    <div className="relative">
                                        <Input 
                                            value={confirm} 
                                            onChange={(e) => setConfirm(e.target.value)} 
                                            type={showPass ? "text" : "password"} 
                                            placeholder="Enter your Password" 
                                            className="h-12 bg-white border border-gray-200 pr-10 rounded-xl focus-visible:ring-[#3FAE2A]" 
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 py-2">
                                    <Checkbox 
                                        id="terms" 
                                        checked={agreed} 
                                        onCheckedChange={(v) => setAgreed(!!v)} 
                                        className="data-[state=checked]:bg-[#3FAE2A] data-[state=checked]:border-[#3FAE2A] border-gray-400" 
                                    />
                                    <label htmlFor="terms" className="text-xs text-gray-500 font-medium cursor-pointer">
                                        I agree with this <span className="text-[#3FAE2A] font-medium">Terms of Use</span> and <span className="text-[#3FAE2A] font-medium">Privacy Policy</span>.
                                    </label>
                                </div>

                                <Button 
                                    onClick={handleNext} 
                                    disabled={isLoading || !agreed} 
                                    className="w-full h-12 bg-[#3FAE2A] hover:bg-[#359624] text-white rounded-xl text-lg font-bold shadow-md mt-4"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Next
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
