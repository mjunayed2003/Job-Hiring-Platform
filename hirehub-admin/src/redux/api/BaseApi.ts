import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../Store";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithTransform: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.data) {
    const res = result.data as any;
    return {
      data: res,
    };
  }

  if (result.error) {
    const err = result.error as any;
    const errorData = err.data as any;
    return {
      error: {
        status: err.status,
        data: {
          message: errorData?.message ?? 'Something went wrong',
          errors: errorData?.errors ?? null,
        },
      },
    };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithTransform, 
  tagTypes: ["auth", "dashboard", "users", "jobs", "categories", "interviews", "settings", "profile", "reports", "subscriptions", "notifications", "payments", "support", "withdrawRequests"],
  endpoints: () => ({}),
});