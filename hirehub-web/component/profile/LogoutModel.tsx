"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutAsync } from "@/redux/authSlice";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/redux/store";

interface LogoutModalProps {
    open: boolean;
    onOpenChange: (o: boolean) => void;
}

export default function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const isLoggingOut = useSelector((state: RootState) => state.auth.isLoggingOut);

    const handleLogout = async () => {
        await dispatch(logoutAsync());
        onOpenChange(false);
        window.location.href = "/auth/signin";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[340px] p-6 text-center rounded-3xl">
                <div className="flex justify-center mb-4 pt-4">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                        <LogOut size={48} className="text-[#0f130f]" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Log Out</h2>
                <p className="text-gray-400 text-sm mb-8 px-4">
                    Do you want to log out your account?
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoggingOut}
                        className="flex-1 bg-slate-500 text-white hover:bg-slate-600 border-none rounded-xl h-12"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex-1 bg-[#3FAE2A] hover:bg-green-700 rounded-xl h-12"
                    >
                        {isLoggingOut ? "Logging out..." : "Log Out"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}