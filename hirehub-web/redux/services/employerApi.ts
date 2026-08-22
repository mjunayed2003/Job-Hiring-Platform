import { apiSlice } from "../apiSlice";

export const employerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmployerProfile: builder.query<any, void>({
      query: () => "/employer/profile",
      providesTags: ['Profile'],
    }),
    updateEmployerProfile: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/employer/profile",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ['Profile'],
    }),
    getEmployerDashboard: builder.query<any, void>({
      query: () => "/employer/dashboard",
    }),
    getEmployerJobs: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page, limit, search } = {}) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.append('page', String(page));
        if (limit !== undefined) params.append('limit', String(limit));
        if (search !== undefined) params.append('search', search);
        const queryString = params.toString();
        return `/employer/jobs${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Job'],
    }),
    getJobById: builder.query<any, string>({
      query: (jobId) => `/employer/jobs/${jobId}`,
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),
    updateJob: builder.mutation<any, { jobId: string; body: Record<string, any> }>({
      query: ({ jobId, body }) => ({
        url: `/employer/jobs/${jobId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { jobId }) => [{ type: 'Job', id: jobId }, 'Job'],
    }),
    deleteEmployerJob: builder.mutation<any, string>({
      query: (jobId) => ({
        url: `/employer/jobs/${jobId}`,
        method: "DELETE",
      }),
      invalidatesTags: ['Job', 'Application'],
    }),
    postJob: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/employer/jobs",
        method: "POST",
        body,
      }),
      invalidatesTags: ['Job'],
    }),
    getJobApplicants: builder.query<any, { jobId: string; page?: number; limit?: number }>({
      query: ({ jobId, page, limit }) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.append('page', String(page));
        if (limit !== undefined) params.append('limit', String(limit));
        const queryString = params.toString();
        return `/employer/jobs/${jobId}/applicants${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result, error, { jobId }) => [{ type: 'Application', id: jobId }, { type: 'Application', id: 'LIST' }],
    }),
    getAllApplicants: builder.query<any, { page?: number; limit?: number; search?: string; filter?: string }>({
      query: ({ page, limit, search, filter } = {}) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.append('page', String(page));
        if (limit !== undefined) params.append('limit', String(limit));
        if (search !== undefined) params.append('search', search);
        if (filter !== undefined) params.append('filter', filter);
        const queryString = params.toString();
        return `/employer/applicants${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: [{ type: 'Application', id: 'LIST' }],
    }),
    getJobSeekerProfile: builder.query<any, string>({
      query: (jobSeekerId) => `/employer/jobseeker/${jobSeekerId}`,
      providesTags: (result, error, id) => [{ type: 'JobSeeker', id }],
    }),
    scheduleInterview: builder.mutation<any, { appId: string; body: Record<string, any> }>({
      query: ({ appId, body }) => ({
        url: `/employer/application/${appId}/interview`,
        method: "POST",
        body,
      }),
      invalidatesTags: ['Interview'],
    }),
    getScheduledInterviews: builder.query<any, void>({
      query: () => "/employer/interviews",
      providesTags: ['Interview'],
    }),
    updateInterview: builder.mutation<any, { interviewId: string; body: Record<string, any> }>({
      query: ({ interviewId, body }) => ({
        url: `/employer/interview/${interviewId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ['Interview'],
    }),
    updateInterviewStatus: builder.mutation<any, { interviewId: string; status: string }>({
      query: ({ interviewId, status }) => ({
        url: `/employer/interview/${interviewId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ['Interview'],
    }),
    updateApplicationStatus: builder.mutation<any, { appId: string; status: string }>({
      query: ({ appId, status }) => ({
        url: `/employer/application/${appId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [{ type: 'Application', id: 'LIST' }, 'Application'],
    }),
    getEmployerSystemContent: builder.query<any, string>({
      query: (key) => `/employer/content/${key}`,
    }),
    getSubscriptionPlans: builder.query<any[], void>({
      query: () => "/employer/subscriptions/plans",
      providesTags: ['Subscription'],
    }),
    getActiveSubscription: builder.query<any, void>({
      query: () => "/employer/subscriptions/active",
      providesTags: ['Subscription'],
    }),
    createSubscriptionPaymentUrl: builder.mutation<any, { planId: string }>({
      query: (body) => ({
        url: "/employer/subscriptions/payment/create-url",
        method: "POST",
        body,
      }),
    }),
    purchaseSubscription: builder.mutation<any, { planId: string }>({
      query: (body) => ({
        url: "/employer/subscriptions/purchase",
        method: "POST",
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetEmployerProfileQuery,
  useUpdateEmployerProfileMutation,
  useGetEmployerDashboardQuery,
  useGetEmployerJobsQuery,
  useGetJobByIdQuery,
  usePostJobMutation,
  useUpdateJobMutation,
  useDeleteEmployerJobMutation,
  useGetJobApplicantsQuery,
  useGetAllApplicantsQuery,
  useGetJobSeekerProfileQuery,
  useScheduleInterviewMutation,
  useGetScheduledInterviewsQuery,
  useUpdateInterviewMutation,
  useUpdateInterviewStatusMutation,
  useUpdateApplicationStatusMutation,
  useGetEmployerSystemContentQuery,
  useGetSubscriptionPlansQuery,
  useGetActiveSubscriptionQuery,
  useCreateSubscriptionPaymentUrlMutation,
  usePurchaseSubscriptionMutation,
} = employerApi;
