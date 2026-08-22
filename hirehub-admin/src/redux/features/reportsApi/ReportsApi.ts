import { baseApi } from "../../api/BaseApi";

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.status) query.set("status", params.status);
        if (params.page) query.set("page", params.page);
        if (params.limit) query.set("limit", params.limit);

        const queryString = query.toString();
        return queryString ? `/admin/reports?${queryString}` : `/admin/reports`;
      },
      providesTags: ["reports"],
    }),

    getReportById: builder.query({
      query: (id) => `/admin/reports/${id}`,
      providesTags: (result, error, id) =>[{ type: "reports", id }],
    }),

    resolveReport: builder.mutation({
      query: (id) => ({
        url: `/admin/reports/${id}/resolve`,
        method: "PATCH",
      }),
      invalidatesTags: ["reports"],
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportByIdQuery,
  useResolveReportMutation,
} = reportsApi;