// src/redux/services/supportApi.ts

import {  apiSlice } from "../apiSlice";

type GetSupportsArgs = {
  page?: number;
  limit?: number;
};

const supportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitSupport: builder.mutation({
      query: (body) => ({
        url: "/support",
        method: "POST",
        body,
      }),
    }),

    getSupports: builder.query({
      query: ({ page = 1, limit = 10 }: GetSupportsArgs = {}) => ({
        url: "/support",
        params: { page, limit },
      }),
      providesTags: ["support"],
    }),
  }),
});

export const { useSubmitSupportMutation, useGetSupportsQuery } = supportApi;