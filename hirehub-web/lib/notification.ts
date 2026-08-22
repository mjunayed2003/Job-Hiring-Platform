// src/lib/notification.js
import { getMessagingInstance } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const FOREGROUND_NOTIFICATIONS_KEY = "foregroundNotifications";

const getStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken") || localStorage.getItem("auth-token");
};

export const requestPermissionAndGetToken = async () => {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    if (!VAPID_KEY) {
      console.warn("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
      return null;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;

  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

export const saveTokenToBackend = async (token: string, accessToken?: string | null) => {
  if (!token) {
    return;
  }

  const bearer = accessToken || getStoredAccessToken();
  if (!bearer) {
    return;
  }

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/firebase/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({ fcmToken: token }),
  });
};

export const registerFirebaseTokenForUser = async (accessToken?: string | null) => {
  const fcmToken = await requestPermissionAndGetToken();
  if (!fcmToken) {
    return;
  }

  await saveTokenToBackend(fcmToken, accessToken);
};

export const onForegroundMessage = async (callback: (payload: unknown) => void) => {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

const clearLocalAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("auth-token");
  localStorage.removeItem("persist:hirehubja-auth");
  localStorage.removeItem(FOREGROUND_NOTIFICATIONS_KEY);
};

export const removeFirebaseTokenAndClearSession = async (accessToken?: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  const bearer = accessToken || getStoredAccessToken();

  try {
    const messaging = await getMessagingInstance();
    if (!messaging || !VAPID_KEY || !bearer) {
      clearLocalAuthSession();
      return;
    }

    const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!fcmToken) {
      clearLocalAuthSession();
      return;
    }

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/firebase/token`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify({ fcmToken }),
    });
  } catch (error) {
    console.warn("Failed to remove firebase token during logout:", error);
  } finally {
    clearLocalAuthSession();
  }
};
