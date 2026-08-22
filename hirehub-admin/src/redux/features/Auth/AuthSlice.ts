import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { baseApi } from "../../api/BaseApi";
import type { RootState } from "../../Store";

export interface User {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

const getUserFromStorage = (): User | null => {
  try {
    const user = localStorage.getItem("user");
    if (!user || user === "undefined" || user === "null") return null;
    return JSON.parse(user);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const token = localStorage.getItem("token") || null;
const user = getUserFromStorage();

// ─── Slice ──────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: { user, token } as AuthState,
  reducers: {
    setLogin: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setLogin, logout } = authSlice.actions;
export default authSlice.reducer;

// ─── Selectors ──────────────────────────────────────────────────
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentToken = (state: RootState) => state.auth.token;

// ─── Auth API (RTK Query) ────────────────────────────────────────
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // POST /admin/auth/login
    login: builder.mutation({
      query: (credentials) => ({
        url: "/admin/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    // GET /admin/profile
    getProfile: builder.query<any, void>({
      query: () => "/admin/profile",
      providesTags: ["profile"],
    }),

    // PUT /admin/profile
    updateProfile: builder.mutation({
      query: (formData) => ({
        url: "/admin/profile",
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["profile"],
    }),

    // POST /admin/auth/change-password
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/admin/auth/change-password",
        method: "POST",
        body: data,
      }),
    }),

    // ─────────────────────────────────────────────────────
    // FORGOT PASSWORD FLOW
    // ─────────────────────────────────────────────────────

    // Step 1 — POST /auth/forgot-password
    // Body: { email }
    // Response: { tempToken }
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    // Verify OTP
    verifyForgotPasswordOtp: builder.mutation({
      query: ({ otp, email }) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: { otp, email },
      }),
    }),

    // Resend OTP
    resendForgotPasswordOtp: builder.mutation({
      query: ({ email }) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: { email }, 
      }),
    }),

    // Step 3 — POST /auth/reset
    // Body: { resetToken, newPassword }
    // Response: { success, message }
    resetPassword: builder.mutation({
      query: ({ resetToken, newPassword }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { resetToken, newPassword },
      }),
    }),

    // ─────────────────────────────────────────────────────
    // REGISTRATION OTP FLOW
    // ─────────────────────────────────────────────────────

    // POST /auth/verify-otp
    // Header: Authorization: Bearer {{tempToken}}
    // Body: { otp }
    verifyOtp: builder.mutation({
      query: ({ otp, token }) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: { otp },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    }),

    // POST /auth/resend-otp
    // Header: Authorization: Bearer {{tempToken}}
    resendOtp: builder.mutation({
      query: ({ token }) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: {},
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    }),

  }),
});

export const {
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  // Forgot Password Flow
  useForgotPasswordMutation,
  useVerifyForgotPasswordOtpMutation,
  useResendForgotPasswordOtpMutation,
  useResetPasswordMutation,
  // Registration OTP Flow
  useVerifyOtpMutation,
  useResendOtpMutation,
} = authApi;