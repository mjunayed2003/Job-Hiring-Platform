// src/redux/features/interviewsApi/interviewsApi.js
import { baseApi } from "../../api/BaseApi";

export const interviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInterviews: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.employer) query.set("employer", params.employer);
        if (params.candidate) query.set("candidate", params.candidate);
        if (params.status) query.set("status", params.status);
        if (params.page) query.set("page", params.page);
        if (params.limit) query.set("limit", params.limit);

        const queryString = query.toString();
        return queryString ? `/admin/interviews?${queryString}` : `/admin/interviews`;
      },
      providesTags:["interviews"],
    }),
  }),
});

export const { useGetInterviewsQuery } = interviewsApi;