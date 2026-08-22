import { baseApi } from "../../api/BaseApi";

const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.status) query.set("status", params.status);
        if (params.search) query.set("search", params.search);
        if (params.page) query.set("page", params.page);
        if (params.limit) query.set("limit", params.limit);

        const queryString = query.toString();
        return queryString ? `/admin/jobs?${queryString}` : `/admin/jobs`;
      },
      providesTags: ["jobs"],
    }),

    getJobById: builder.query({
      query: (id) => `/admin/jobs/${id}`,
      providesTags: ["jobs"],
    }),

    // NEW: Get applications for a job
    getJobApplications: builder.query({
      query: ({ jobId, page = 1, limit = 10 }) =>
        `/admin/jobs/${jobId}/applications?page=${page}&limit=${limit}`,
      providesTags: ["jobs"],
    }),

    blockJob: builder.mutation({
      query: (id) => ({
        url: `/admin/jobs/${id}/block`,
        method: "PATCH",
      }),
      invalidatesTags: ["jobs"],
    }),

    unblockJob: builder.mutation({
      query: (id) => ({
        url: `/admin/jobs/${id}/unblock`,
        method: "PATCH",
      }),
      invalidatesTags: ["jobs"],
    }),
    deleteJob: builder.mutation({
      query: (id) => ({
        url: `/admin/jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["jobs"],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useGetJobApplicationsQuery,
  useBlockJobMutation,
  useUnblockJobMutation,
  useDeleteJobMutation
} = jobsApi;