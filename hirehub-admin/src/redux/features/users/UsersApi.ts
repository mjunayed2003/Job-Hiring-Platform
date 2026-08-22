import { baseApi } from "../../api/BaseApi";

const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        if (params.role) query.set("role", params.role);
        if (params.status) query.set("status", params.status);
        if (params.search) query.set("search", params.search);
        if (params.page) query.set("page", params.page);
        if (params.limit) query.set("limit", params.limit);
        return `/admin/users?${query.toString()}`;
      },
      providesTags: ["users"],
    }),

    getUserById: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: ["users"],
    }),

    approveUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["users", "dashboard"],
    }),

    sendVerificationBackupLink: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/verification-backup-link`,
        method: "POST",
      }),
      invalidatesTags: ["users", "dashboard"],
    }),

    uploadVerificationBackup: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/admin/users/${id}/verification-backup`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["users", "dashboard"],
    }),

    rejectUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: ["users", "dashboard"],
    }),

    blockUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/block`,
        method: "PATCH",
      }),
      invalidatesTags: ["users"],
    }),


    pendingUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/pending`,
        method: "PATCH",
      }),
      invalidatesTags: ["users"],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["users"],
    }),
    sendMail: builder.mutation({
      query: (body) => ({
        url: "/admin/send-mail",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useApproveUserMutation,
  useSendVerificationBackupLinkMutation,
  useUploadVerificationBackupMutation,
  useRejectUserMutation,
  useBlockUserMutation,
  usePendingUserMutation,
  useDeleteUserMutation,
  useSendMailMutation,
} = usersApi;
