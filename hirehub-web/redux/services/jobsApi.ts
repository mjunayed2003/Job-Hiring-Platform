import { apiSlice } from "../apiSlice";

export const jobsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    getPublicJobs: builder.query<any, Record<string, any> | void>({
      query: (params) => ({
        url: "/public/jobs",
        params: params || undefined, 
      }),
      providesTags: ['publicJob'],
    }),    
    getJobs: builder.query<any, Record<string, any> | void>({
      query: (params) => ({
        url: "/jobs",
        params: params || undefined, 
      }),
      providesTags: ['Job'],
    }),
    getJobDetails: builder.query<any, { id: string; token?: string | null }>({
      query: ({ id, token }) => ({
        url: `/jobs/${id}/details`,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
      providesTags: (result, error, arg) => [{ type: 'Job', id: arg.id }],
    }),
    getJobById: builder.query<any, string>({
      query: (id) => `/employer/jobs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),
    applyForJob: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/jobs/apply",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ['Application'],
    }),
    updateJob: builder.mutation<any, { jobId: string; body: Record<string, any> }>({
      query: ({ jobId, body }) => ({
        url: `/employer/jobs/${jobId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ['Job'],
    }),
    deleteJob: builder.mutation<any, string>({
      query: (jobId) => ({
        url: `/employer/jobs/${jobId}`,
        method: "DELETE",
      }),
      invalidatesTags: ['Job'],
    }),
    getMyApplications: builder.query<any, void>({
      query: () => "/jobs/my-applications",
      providesTags: ['Application'],
    }),
    reportJob: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/jobs/report",
        method: "POST",
        body,
      }),
    }),
    bookmarkJob: builder.mutation<any, string>({
      query: (id) => ({
        url: `/jobs/${id}/bookmark`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Job", id },
        { type: "Job", id: "LIST" },
        "Application",
      ],
    }),
    getMyBookmarks: builder.query<any, void>({
      query: () => "/jobs/my-bookmarks",
    }),
    getPlatformFee: builder.query<{ percent: number }, void>({
      query: () => "/admin/settings/platform-fee",
    }),

    // --- Job Seeker Profile Management ---
    getJobSeekerProfile: builder.query<any, void>({
      query: () => "/jobs/profile",
      providesTags: ['Profile'],
    }),
    updateJobSeekerProfile: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/jobs/profile",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const {
  useGetPublicJobsQuery,
  useGetJobsQuery,
  useGetJobDetailsQuery,
  useGetJobByIdQuery,
  useApplyForJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetMyApplicationsQuery,
  useReportJobMutation,
  useBookmarkJobMutation,
  useGetMyBookmarksQuery,
  useGetPlatformFeeQuery,
  useGetJobSeekerProfileQuery,
  useUpdateJobSeekerProfileMutation,
} = jobsApi;
