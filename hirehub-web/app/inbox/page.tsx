"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InboxPage from "@/component/inbox/Inbox";
import { useAppSelector } from "@/redux/hooks";

const getTokenFromCookie = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/auth-token=([^;]+)/);
  return match ? match[1] : null;
};

export default function Page() {
  const router = useRouter();
  const reduxToken = useAppSelector((state) => state.auth.token);
  const [isReady, setIsReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = reduxToken || getTokenFromCookie();
    if (!token) {
      router.replace("/auth/signin?from=/inbox");
      return;
    }

    setIsAuthorized(true);
    setIsReady(true);
  }, [reduxToken, router]);

  if (!isReady && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-10 w-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <InboxPage />;
}
