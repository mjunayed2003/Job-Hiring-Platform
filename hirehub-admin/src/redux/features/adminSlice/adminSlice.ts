import { baseApi } from "../../api/BaseApi";

// Inject admin endpoints into baseApi
export const AdminSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAdmin: builder.mutation({
      query: (data) => ({
        url: "/admin/auth/create",
        method: "POST",
        body: data,
      }),
    }),
    getAllAdmins: builder.query({
      query: () => ({
        url: "/admin/auth/all",
        method: "GET",
      }),
    }),
    deleteAdmin: builder.mutation({
      query: (adminId) => ({
        url: `/admin/auth/delete/${adminId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateAdminMutation,
  useGetAllAdminsQuery,
  useDeleteAdminMutation,
} = AdminSlice;