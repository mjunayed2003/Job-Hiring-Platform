"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import { useAppDispatch } from "@/redux/hooks";
import { useAppSelector } from "@/redux/hooks";
import { setTempToken } from "@/redux/authSlice";
import { useLoginMutation } from "@/redux/services/authApi";
import { requestPermissionAndGetToken } from "@/lib/notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Backend role → Frontend role map asdfasdf
const roleMap: Record<string, "company" | "employer" | "job-seeker"> = {
    EMPLOYER: "employer",
    COMPANY: "company",
    JOB_SEEKER: "job-seeker",
};

export default function SignInPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const searchParams = useSearchParams();
    const reduxToken = useAppSelector((state) => state.auth.token);

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [authChecked, setAuthChecked] = useState(false);

    //  RTK Query mutation hook
    const [loginUser, { isLoading }] = useLoginMutation();

    useEffect(() => {
        const cookieToken =
            typeof document !== "undefined"
                ? document.cookie.match(/auth-token=([^;]+)/)?.[1] ?? null
                : null;

        const token = reduxToken || cookieToken;
        if (token) {
            const from = searchParams.get("from");
            router.replace(from || "/");
            return;
        }

        setAuthChecked(true);
    }, [reduxToken, router, searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
        const fcmToken = await requestPermissionAndGetToken();
        const data = await loginUser({
            email: formData.email,
            password: formData.password,
            ...(fcmToken ? { fcmToken } : {}),
        }).unwrap();

        const { token, user } = data;

        if (data?.needsVerification) {
            if (typeof window !== "undefined") {
                sessionStorage.setItem("pending_verify_email", formData.email);
                if (data?.tempToken) {
                    sessionStorage.setItem("tempToken", data.tempToken);
                }
                document.cookie = "auth-token=; path=/; max-age=0";
                document.cookie = "user-role=; path=/; max-age=0";
            }

            if (data?.tempToken) {
                dispatch(setTempToken(data.tempToken));
            }

            const redirectPath =
                data?.nextStep ||
                (user?.role === "JOB_SEEKER"
                    ? "/auth/signup/job-seeker/step-6"
                    : user?.role === "COMPANY"
                        ? "/auth/signup/company/step-4"
                        : "/auth/signup/employer/step-4");
            router.push(redirectPath);
            return;
        }

        // Cookie set
        document.cookie = `auth-token=${token}; path=/; max-age=86400`;
        document.cookie = `user-role=${user.role}; path=/; max-age=86400`;

        const from = searchParams.get("from");
        router.push(from || "/");
        
    } catch (err: any) {
        const message =
            err?.data?.message ||
            err?.error ||
            "Login failed. Please try again.";

        if (err?.data?.needsVerification) {
            if (typeof window !== "undefined") {
                sessionStorage.setItem("pending_verify_email", formData.email);
            }
            router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
            return;
        }
        setError(message);
    }
};

    return (
        !authChecked ? (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="h-10 w-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            </div>
        ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">

                {/* LEFT SIDE */}
                <div className="relative w-full md:w-1/2 hidden md:block">
                    <Image
                        src="/image/jaimica7.webp"
                        alt="Team handshake"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center text-white shadow-lg">
                        <h3 className="text-lg font-bold">Welcome to HireHubJA</h3>
                        <p className="text-sm opacity-90 mt-1">Login to explore more</p>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col items-center justify-center p-8 md:p-12">

                    <div className="mb-6 text-center">
                        <Image src="/image/logo.svg" alt="HireHubJA Logo" width={200} height={100} className="object-contain mx-auto" />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-green-700">Welcome Back!</h1>
                        <p className="text-gray-500 text-sm mt-2">Sign in to manage your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm w-full max-w-md rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="w-full max-w-md space-y-5">

                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-xs font-medium text-gray-600 ml-1">Email</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10 rounded-xl bg-white border-none py-6 shadow-sm focus-visible:ring-green-500"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="password" className="text-xs font-medium text-gray-600 ml-1">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    className="pl-10 pr-10 rounded-xl bg-white border-none py-6 shadow-sm focus-visible:ring-green-500"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link href="/auth/forgot-password" className="text-xs text-green-600 hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#3FAE2A] hover:bg-[#359624] text-white font-bold rounded-full py-6 text-lg shadow-lg mt-4 transition-all"
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>

                    <Link
                        href="/jobseeker/jobs"
                        className="mt-4 w-full max-w-md rounded-full border border-green-600 bg-white px-6 py-4 text-center text-sm font-semibold text-green-700 shadow-sm transition-colors hover:bg-green-50"
                    >
                        Guest Sign In
                    </Link>

                    <div className="mt-8 text-sm text-gray-500">
                        Don&apos;t have an account?
                        <Link href="/auth/signup" className="text-[#3FAE2A] font-semibold ml-1 hover:underline">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        )
    );
}
