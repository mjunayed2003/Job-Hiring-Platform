import { apiSlice } from "../apiSlice";

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchMessageUsers: builder.query<any, string>({
      query: (q) => ({
        url: `/messages/users/search?q=${encodeURIComponent(q)}`,
        method: "GET",
      }),
      providesTags: ["Conversation"],
    }),

    getOrCreateConversation: builder.mutation<
      any,
      { targetUserId: string; receiverId?: string; participantId?: string }
    >({
      query: ({ targetUserId, receiverId, participantId }) => ({
        url: "/messages/conversation",
        method: "POST",
        // Send multiple aliases to support backend variations.
        body: {
          targetUserId,
          receiverId: receiverId ?? targetUserId,
          participantId: participantId ?? targetUserId,
        },
      }),
      invalidatesTags: ["Conversation"],
    }),

    uploadAttachment: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/messages/upload",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useSearchMessageUsersQuery,
  useGetOrCreateConversationMutation,
  useUploadAttachmentMutation,
} = messagesApi;
