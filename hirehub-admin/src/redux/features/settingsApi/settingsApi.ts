import { baseApi } from "../../api/BaseApi";

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPage: builder.query({
      query: (pageName) => `/public/${pageName}`,
      providesTags: (result, error, pageName) => [{ type: "settings", id: pageName }],
    }),
    updatePage: builder.mutation({
      query: ({ pageName, data }) => ({
        url: `/public/${pageName}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { pageName }) => [{ type: "settings", id: pageName }],
    }),
    getPlatformFee: builder.query({
      query: () => "/admin/settings/platform-fee",
      providesTags: ["settings"],
    }),
    setPlatformFee: builder.mutation({
      query: (percent) => ({
        url: "/admin/settings/platform-fee",
        method: "PATCH",
        body: { percent },
      }),
      invalidatesTags: ["settings"],
    }),
  }),
});

export const { useGetPageQuery, useUpdatePageMutation, useGetPlatformFeeQuery, useSetPlatformFeeMutation } = settingsApi;