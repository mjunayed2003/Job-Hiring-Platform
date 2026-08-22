// lib/apiClient.ts
import { store } from "@/redux/store";
import { logout } from "@/redux/authSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type RequestOptions = {
    method?: string;
    body?: Record<string, unknown> | FormData;
    headers?: Record<string, string>;
};

export async function apiClient<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    // ✅ Redux store থেকে token নাও
    const token = store.getState().auth.token;

    const isFormData = body instanceof FormData;

    const finalHeaders: Record<string, string> = {
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: finalHeaders,
        ...(body && { body: isFormData ? body : JSON.stringify(body) }),
    });

    if (response.status === 401) {
        store.dispatch(logout());
        document.cookie = "auth-token=; path=/; max-age=0";
        document.cookie = "user-role=; path=/; max-age=0";
        window.location.href = "/auth/signin";
        throw new Error("Unauthorized");
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data as T;
}

// ✅ Shorthand helpers
export const api = {
    get: <T>(endpoint: string) =>
        apiClient<T>(endpoint, { method: "GET" }),

    post: <T>(endpoint: string, body: Record<string, unknown> | FormData) =>
        apiClient<T>(endpoint, { method: "POST", body }),

    put: <T>(endpoint: string, body: Record<string, unknown> | FormData) =>
        apiClient<T>(endpoint, { method: "PUT", body }),

    patch: <T>(endpoint: string, body?: Record<string, unknown>) =>
        apiClient<T>(endpoint, { method: "PATCH", body }),

    delete: <T>(endpoint: string) =>
        apiClient<T>(endpoint, { method: "DELETE" }),
};