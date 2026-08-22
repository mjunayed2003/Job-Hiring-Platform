"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ArrowLeft, KeyRound } from "lucide-react";
import { useChangePasswordMutation } from "@/redux/services/authApi";

export default function ChangePasswordPage() {
  const router = useRouter();
    const [changePassword, { isLoading }] = useChangePasswordMutation();
  
  // State for toggling password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setErrorMessage("Please fill all password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("New password and confirm password do not match.");
            return;
        }

        try {
            await changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            }).unwrap();

            alert("Password updated successfully.");
            router.back();
        } catch (error) {
            console.error("Failed to change password:", error);
            const backendMessage =
                (error as any)?.data?.message ||
                (error as any)?.error ||
                "Failed to change password. Please try again.";
            setErrorMessage(backendMessage);
        }
    };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4 font-sans text-[#1a1a1a]">
      
      {/* ---------------- CARD SECTION ---------------- */}
      <div className="w-full max-w-[500px] bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 p-8 md:p-10 relative">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="absolute top-8 left-8 text-gray-400 hover:text-[#3FAE2A] transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-6 mt-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-[#3FAE2A]" />
            </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
            <p className="text-gray-500 text-sm mt-2">
                Your new password must be different from previously used passwords.
            </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>       

            {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMessage}
                </div>
            ) : null}
            
            {/* 1. Current Password */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Current Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type={showCurrent ? "text" : "password"}
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-12 text-sm outline-none focus:border-[#3FAE2A] focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400 text-gray-800"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                        {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {/* 2. New Password */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type={showNew ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-12 text-sm outline-none focus:border-[#3FAE2A] focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400 text-gray-800"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                        {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <p className="text-xs text-gray-400 ml-1">Must be at least 8 characters.</p>
            </div>

            {/* 3. Confirm Password */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-12 text-sm outline-none focus:border-[#3FAE2A] focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400 text-gray-800"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                        {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-3">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#3FAE2A] hover:bg-[#359623] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 transition-all transform active:scale-[0.98]"
                >
                    {isLoading ? "Updating..." : "Update Password"}
                </button>
                <button 
                    type="button"
                    onClick={() => router.back()}
                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-3.5 rounded-xl transition-all"
                >
                    Cancel
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}