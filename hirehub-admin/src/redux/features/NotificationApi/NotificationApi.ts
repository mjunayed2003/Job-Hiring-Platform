// src/redux/features/Notifications/NotificationApi.ts

import { baseApi } from "../../api/BaseApi";

export interface Notification {
  id: string;
  senderName: string;
  senderProfilePic: string;
  message: string;
  time: string;
  isRead?: boolean;
}

export interface NotificationListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Notification[];
  pagination: {
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    unreadCount: number;
  };
}

export interface NotificationParams {
  skip?: number;
  take?: number;
}

const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /notifications
    getNotifications: builder.query<NotificationListResponse, NotificationParams>({
      query: ({ skip = 0, take = 20 } = {}) => ({
        url: "/notifications",
        method: "GET",
        params: { skip, take },
      }),
      providesTags: ["notifications"],
    }),

    // GET /notifications/unread-count
    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: "/notifications/unread-count",
        method: "GET",
      }),
      providesTags: ["notifications"],
    }),

    // PATCH /notifications/:id/read
    markAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["notifications"],
    }),

    // PATCH /notifications/read-all
markAllAsRead: builder.mutation<void, void>({
  query: () => ({
    url: "/notifications/read-all",
    method: "PATCH",
  }),
  invalidatesTags: ["notifications"],
}),

    // DELETE /notifications/:id
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;