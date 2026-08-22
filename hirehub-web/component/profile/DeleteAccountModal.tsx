"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { useDeleteAccountMutation } from "@/redux/services/authApi";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteAccountModal({
  open,
  onOpenChange,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();
  
  const handleDelete = async () => {
    try {
      await deleteAccount().unwrap();
      onOpenChange(false);
      router.push("/auth/signin");
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-6 rounded-[20px] border-none flex flex-col items-center">
        
        {/* Custom Close Button */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-red-500 hover:opacity-70 transition"
        >
          <X size={20} />
        </button>

        {/* Illustration/Icon Area */}
        <div className="mt-4 mb-4 relative flex items-center justify-center">
          {/* If you have the image from the screenshot, use it here */}
          <div className="relative w-24 h-24 flex items-center justify-center">
             {/* Fallback Icon if image not found */}
             <div className="bg-gray-100 p-4 rounded-full">
                <Trash2 size={40} className="text-red-500" />
             </div>
             {/* Example of how to use the exact image if available: */}
             {/* <Image src="/image/delete-account-illus.png" alt="Delete" fill className="object-contain" /> */}
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xl font-extrabold text-gray-800">Delete Account</h2>
          <p className="text-[13px] text-slate-400 font-medium px-4 leading-tight">
            Do you want to delete your account?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full gap-3">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-[#64748B] hover:bg-slate-600 text-white font-bold h-11 rounded-xl border-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 bg-[#EF4444] hover:bg-red-700 text-white font-bold h-11 rounded-xl border-none shadow-lg shadow-red-100 disabled:opacity-60"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}