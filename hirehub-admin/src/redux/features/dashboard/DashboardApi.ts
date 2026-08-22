import { baseApi } from "../../api/BaseApi";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /admin/dashboard/stats
    getDashboardStats: builder.query<any, void>({
      query: () => "/admin/dashboard/stats",
      providesTags: ["dashboard"],
    }),

    // GET /admin/dashboard/pie-chart
    getPieChart: builder.query<any, void>({
      query: () => "/admin/dashboard/pie-chart",
      providesTags: ["dashboard"],
    }),

    // GET /admin/dashboard/earnings?period=weekly|monthly|yearly
    getEarnings: builder.query<any, string | void>({
      query: (period = "yearly") => `/admin/dashboard/earnings?period=${period}`,
      providesTags: ["dashboard"],
    }),

    // GET /admin/dashboard/approval-requests?type=JOB_SEEKER|EMPLOYER|COMPANY&limit=10
    getApprovalRequests: builder.query({
      query: (arg) => {
        const { type = "ALL", limit = 10, page = 1 } = arg || {};
        // If type is "ALL", we don't pass the type param so the backend returns everything
        const typeQuery = type === "ALL" ? "" : `&type=${type}`;
        return `/admin/dashboard/approval-requests?limit=${limit}&page=${page}${typeQuery}`;
      },
      providesTags: ["dashboard", "users"],
    }),

    // GET /admin/dashboard/interviews?limit=10
    getDashboardInterviews: builder.query<any, { limit?: number } | void>({
      query: (arg) => {
        const { limit = 10 } = arg || {};
        return `/admin/dashboard/interviews?limit=${limit}`;
      },
      providesTags: ["dashboard"],
    }),

  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetPieChartQuery,
  useGetEarningsQuery,
  useGetApprovalRequestsQuery,
  useGetDashboardInterviewsQuery,
} = dashboardApi;