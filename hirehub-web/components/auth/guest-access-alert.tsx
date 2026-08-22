"use client";

import Link from "next/link";
import { AlertCircle, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type GuestAccessAlertProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromPath: string;
};

export default function GuestAccessAlert({
  open,
  onOpenChange,
  fromPath,
}: GuestAccessAlertProps) {
  const loginHref = `/auth/signin?from=${encodeURIComponent(fromPath)}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-3xl p-6 sm:p-7">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="size-5" />
        </button>

        <AlertDialogHeader className="gap-4">
          <AlertDialogMedia className="bg-[#F0FDF4] text-[#3FAE2A]">
            <AlertCircle className="size-8" />
          </AlertDialogMedia>
          <div className="space-y-2 text-center">
            <AlertDialogTitle className="text-2xl font-bold text-[#3FAE2A]">
              Account Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-gray-500">
              To continue with this action, please create an account or sign in.
              You can still browse jobs, search, and view job details as a guest.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2 gap-3 sm:flex-col">
          <Button
            asChild
            className="w-full rounded-full bg-[#3FAE2A] py-6 text-base font-semibold text-white hover:bg-[#359624]"
          >
            <Link href="/auth/signup">Sign Up as Job Seeker</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full rounded-full border-[#3FAE2A] py-6 text-base font-semibold text-[#3FAE2A] hover:bg-green-50 hover:text-[#359624]"
          >
            <Link href={loginHref}>Login</Link>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}