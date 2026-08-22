// src/redux/features/SupportApi/SupportApi.ts

import { baseApi } from "../../api/BaseApi";

const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSupports: builder.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/support",
        params: { page, limit },
      }),
      providesTags: ["support"],
    }),
  }),
});

export const { useGetSupportsQuery } = supportApi;