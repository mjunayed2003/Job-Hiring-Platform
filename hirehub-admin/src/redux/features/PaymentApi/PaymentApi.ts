// src/redux/features/PaymentApi/PaymentApi.ts

import { baseApi } from "../../api/BaseApi";

export interface PaymentListParams {
  search?: string;
   type?: "JOB_PAYMENT" | "SUBSCRIPTION";
  page?: number;
  limit?: number;
}


const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPayments: builder.query({
      query: ({ search, type, page = 1, limit = 10 }: PaymentListParams) => ({
        url: "/admin/payments",
        params: { search, type, page, limit }, 
        method: "GET",
      }),
      providesTags: ["payments"],
    }),

    markAsFailed: builder.mutation({
      query: ({ id, type }: { id: string; type: "job" | "subscription" }) => ({
        url: `/admin/payments/${id}/fail`,
        method: "PATCH",
        params: { type },
      }),
      invalidatesTags: ["payments"],
    }),
  }),
});

export const { useGetAllPaymentsQuery, useMarkAsFailedMutation } = paymentApi;