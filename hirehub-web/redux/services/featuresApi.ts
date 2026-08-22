import { apiSlice } from "../apiSlice";

export const featuresApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- Categories ---
    getCategories: builder.query<any, void>({
      query: () => "/categories",
    }),

    // --- Public Content ---
    getAboutUs: builder.query<any, void>({ query: () => "/public/about_us" }),
    getTermsCondition: builder.query<any, void>({ query: () => "/public/terms_condition" }),
    getPrivacyPolicy: builder.query<any, void>({ query: () => "/public/privacy_policy" }),
    getHealth: builder.query<any, void>({ query: () => "/health" }),

    // --- Notifications ---
    getNotifications: builder.query<any, void>({
      query: () => "/notifications",
      providesTags: ['Notification'],
    }),
    getUnreadNotificationCount: builder.query<any, void>({
      query: () => "/notifications/unread-count",
      providesTags: ['Notification'],
    }),
    markNotificationAsRead: builder.mutation<any, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsAsRead: builder.mutation<any, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation<any, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ['Notification'],
    }),
    deleteAllNotifications: builder.mutation<any, void>({
      query: () => ({ url: "/notifications/all", method: "GET" }), // Note: defined as GET in postman collection
      invalidatesTags: ['Notification'],
    }),

    // --- Messages ---
    createMessageConversation: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/messages/conversation", method: "POST", body }),
    }),

    // --- Payments ---
    createPaymentUrl: builder.mutation<any, { interviewId: string }>({
      query: (body) => ({ url: "/payment/create-url", method: "POST", body }),
    }),
    markHireCompleted: builder.mutation<any, { interviewId: string }>({
      query: ({ interviewId }) => ({
        url: `/payment/interview/${interviewId}/complete`,
        method: "POST",
      }),
      invalidatesTags: ['Application', 'Payment'],
    }),
    markEmployerHireCompleted: builder.mutation<any, { interviewId: string }>({
      query: ({ interviewId }) => ({
        url: `/payment/interview/${interviewId}/employer-complete`,
        method: "POST",
      }),
      invalidatesTags: ['Application', 'Payment'],
    }),
    getPaymentStatus: builder.query<any, string>({
      query: (orderId) => `/payment/status/${orderId}`,
    }),
    getMyPayments: builder.query<any, void>({
      query: () => "/payment/my-payments",
      providesTags: ['Payment']
    }),

    // --- Card Verification ---
    initiateCardVerification: builder.mutation<any, void>({
      query: () => ({ url: "/card-verification/initiate", method: "POST" }),
    }),
    confirmCardVerification: builder.mutation<any, { amount: number }>({
      query: (body) => ({ url: "/card-verification/confirm", method: "POST", body }),
    }),
    getCardVerificationStatus: builder.query<any, void>({
      query: () => "/card-verification/status",
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetAboutUsQuery,
  useGetTermsConditionQuery,
  useGetPrivacyPolicyQuery,
  useGetHealthQuery,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  useCreateMessageConversationMutation,
  useCreatePaymentUrlMutation,
  useMarkHireCompletedMutation,
  useMarkEmployerHireCompletedMutation,
  useGetPaymentStatusQuery,
  useGetMyPaymentsQuery,
  useInitiateCardVerificationMutation,
  useConfirmCardVerificationMutation,
  useGetCardVerificationStatusQuery,
} = featuresApi;

