import { apiSlice } from "../apiSlice";
import { login, logout, setTempToken } from "../authSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, Record<string, any>>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.token) {
            dispatch(login({ user: data.user, token: data.token }));
          }
        } catch { }
      },
    }),

    register: builder.mutation<any, Record<string, any>>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.tempToken) {
            dispatch(setTempToken(data.tempToken));
          }
        } catch { }
      },
    }),

    logout: builder.mutation<any, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logout());
        } catch {
          dispatch(logout());
        }
      },
    }),

    // ── Step 1: Send forgot-password email → returns tempToken ──
    forgotPassword: builder.mutation<any, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
        headers: { 'x-no-auth': 'true' },
      }),
    }),

    // ── Step 2a: Verify OTP (forgot-password flow) — needs tempToken in header ──
    forgotPasswordVerifyOtp: builder.mutation<any, { otp: string; tempToken: string }>({
      query: ({ otp, tempToken }) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: { otp },
        headers: { Authorization: `Bearer ${tempToken}` },
      }),
    }),

    // ── Step 2b: Resend OTP (forgot-password flow) — needs tempToken in header ──
    forgotPasswordResendOtp: builder.mutation<any, { tempToken: string }>({
      query: ({ tempToken }) => ({
        url: "/auth/resend-otp",
        method: "POST",
        headers: { Authorization: `Bearer ${tempToken}` },
      }),
    }),

    // ── Step 3: Reset password — needs final tempToken in header ──
    resetPassword: builder.mutation<any, { newPassword: string; confirmPassword: string; tempToken: string }>({
      query: ({ newPassword, confirmPassword, tempToken }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { newPassword, confirmPassword },
        headers: { Authorization: `Bearer ${tempToken}` },
      }),
    }),

    verifyOtp: builder.mutation<any, { otp: string; email?: string; tempToken?: string }>({
      query: ({ otp, email, tempToken }) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: email ? { otp, email } : undefined,
        headers: tempToken ? { Authorization: `Bearer ${tempToken}` } : undefined,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.tempToken) {
            dispatch(setTempToken(data.tempToken));
          }
        } catch { }
      },
    }),

    resendOtp: builder.mutation<any, { email?: string; tempToken?: string } | void>({
      query: ({ email, tempToken } = {}) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: email ? { email } : undefined,
        headers: tempToken ? { Authorization: `Bearer ${tempToken}` } : undefined,
      }),
    }),

    deleteAccount: builder.mutation<any, void>({
      query: () => ({
        url: "/auth/account",
        method: "DELETE",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logout());
        } catch { }
      },
    }),

    changePassword: builder.mutation<
      any,
      { currentPassword: string; newPassword: string; confirmPassword: string }
    >({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),

    // Job Seeker
    setupJobSeekerBasic: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/profile/job-seeker/basic",
        method: "POST",
        body: formData,
      }),
    }),

    setupJobSeekerEducation: builder.mutation<any, { education: any[] }>({
      query: (body) => ({
        url: "/auth/profile/job-seeker/education",
        method: "POST",
        body,
      }),
    }),

    setupJobSeekerProfessional: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/profile/job-seeker/professional",
        method: "POST",
        body: formData,
      }),
    }),

    setupJobSeekerVerification: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/profile/job-seeker/verification",
        method: "POST",
        body: formData,
      }),
    }),

    // Employer
    setupEmployerBasic: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/profile/employer/basic",
        method: "POST",
        body: formData,
      }),
    }),

    setupEmployerVerification: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/profile/employer/verification",
        method: "POST",
        body: formData,
      }),
    }),

    // Company
    setupCompanyBasic: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/profile/company/basic",
        method: "POST",
        body: formData,
      }),
    }),

    setupCompanyVerification: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/profile/company/verification",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordVerifyOtpMutation,
  useForgotPasswordResendOtpMutation,
  useResetPasswordMutation,
  useDeleteAccountMutation,
  useChangePasswordMutation,
  useSetupJobSeekerBasicMutation,
  useSetupJobSeekerEducationMutation,
  useSetupJobSeekerProfessionalMutation,
  useSetupJobSeekerVerificationMutation,
  useSetupEmployerBasicMutation,
  useSetupEmployerVerificationMutation,
  useSetupCompanyBasicMutation,
  useSetupCompanyVerificationMutation,
} = authApi;