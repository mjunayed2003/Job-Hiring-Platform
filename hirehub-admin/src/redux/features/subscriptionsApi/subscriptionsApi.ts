import { baseApi } from "../../api/BaseApi";

export const subscriptionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<any, void>({
      query: () => `/admin/subscriptions`,
      providesTags: ["subscriptions"],
    }),

    createPlan: builder.mutation({
      query: (data) => ({
        url: `/admin/subscriptions`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["subscriptions"],
    }),

    updatePlan: builder.mutation({
      query: ({ id, data }) => ({
        url: `/admin/subscriptions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["subscriptions"],
    }),

    deletePlan: builder.mutation({
      query: (id) => ({
        url: `/admin/subscriptions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["subscriptions"],
    }),

    getCompanySubscription: builder.query<any, string>({
      query: (userId) => `/admin/subscriptions/company/${userId}`,
      providesTags: ["subscriptions"],
    }),

    assignCompanySubscription: builder.mutation<any, { userId: string; body: Record<string, any> }>({
      query: ({ userId, body }) => ({
        url: `/admin/subscriptions/company/${userId}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["subscriptions", "users", "dashboard"],
    }),

    activateCompanySubscription: builder.mutation<any, { userId: string; body: Record<string, any> }>({
      query: ({ userId, body }) => ({
        url: `/admin/subscriptions/company/${userId}/activate`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["subscriptions", "users", "dashboard"],
    }),

    extendCompanySubscription: builder.mutation<any, { userId: string; body: Record<string, any> }>({
      query: ({ userId, body }) => ({
        url: `/admin/subscriptions/company/${userId}/extend`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["subscriptions", "users", "dashboard"],
    }),

    modifyCompanySubscription: builder.mutation<any, { userId: string; body: Record<string, any> }>({
      query: ({ userId, body }) => ({
        url: `/admin/subscriptions/company/${userId}/modify`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["subscriptions", "users", "dashboard"],
    }),

    cancelCompanySubscription: builder.mutation<any, { userId: string; body?: Record<string, any> }>({
      query: ({ userId, body }) => ({
        url: `/admin/subscriptions/company/${userId}/cancel`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["subscriptions", "users", "dashboard"],
    }),
  }),
  overrideExisting: false,
});

// Auto-generated hooks
export const {
  useGetPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useGetCompanySubscriptionQuery,
  useAssignCompanySubscriptionMutation,
  useActivateCompanySubscriptionMutation,
  useExtendCompanySubscriptionMutation,
  useModifyCompanySubscriptionMutation,
  useCancelCompanySubscriptionMutation,
} = subscriptionsApi;
