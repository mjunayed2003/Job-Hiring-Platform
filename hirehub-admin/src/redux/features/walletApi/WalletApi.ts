import { baseApi } from "../../api/BaseApi";

export interface WithdrawRequest {
  id: string;
  amount: number;
  accountHolderName: string;
  bankName: string;
  branch: string;
  accountType: string;
  accountNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
  jobSeeker: {
    id: string;
    fullName: string;
    profilePic: string | null;
    phone: string | null;
    email: string;
    walletBalance: number;
  };
  employer?: {
    id: string;
    fullName: string;
    companyName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  payment?: {
    orderId: string;
    paymentId: string;
    paidAt: string | null;
    amount: number;
    platformFee: number;
    netAmount: number;
    job: {
      id: string;
      title: string;
      location: string | null;
      salaryType: string | null;
      salaryFrequency: string | null;
      salaryAmount: string | null;
    } | null;
    employer: {
      id: string;
      fullName: string;
      companyName: string | null;
      phone: string | null;
      email: string | null;
    } | null;
  } | null;
}

export interface WithdrawRequestsResponse {
  data: WithdrawRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWithdrawRequests: builder.query<
      WithdrawRequestsResponse,
      { status?: string; page?: number; limit?: number }
    >({
      query: ({ status, page = 1, limit = 20 }) => ({
        url: "/admin/wallet/withdraw-requests",
        params: { status, page, limit },
        method: "GET",
      }),
      providesTags: ["withdrawRequests"],
    }),

    processWithdrawRequest: builder.mutation<
      { message: string },
      { id: string; status: "APPROVED" | "REJECTED"; adminNote: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/wallet/withdraw-requests/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["withdrawRequests"],
    }),
  }),
});

export const {
  useGetWithdrawRequestsQuery,
  useProcessWithdrawRequestMutation,
} = walletApi;
