import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, UserRole } from '../generated/prisma/client';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) { }

  private userSelect = {
    id: true,
    role: true,
    onlineAt: true,
    lastSeenAt: true,
    jobSeekerProfile: { select: { fullName: true, profilePic: true } },
    employerProfile: { select: { fullName: true, profilePic: true, companyName: true } },
  };

  // ==================================================
  // 1. GET OR CREATE CONVERSATION
  // ==================================================
  async getOrCreateConversation(userId1: string, userId2: string) {
    // Check if conversation already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: this.userSelect,
            },
          },
        },
      },
    });

    if (existing) return existing;

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: userId1 },
            { userId: userId2 },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: this.userSelect,
            },
          },
        },
      },
    });
  }

  // ==================================================
  // 2. GET ALL CONVERSATIONS (Inbox)
  // ==================================================
  async getConversations(userId: string) {
    const result = await this.getConversationsPaginated(userId, {
      page: 1,
      limit: 20,
    });

    return result.data;
  }

  async getConversationsPaginated(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ) {
    const page = Number.isFinite(params?.page) && (params?.page ?? 0) > 0
      ? Math.floor(params!.page!)
      : 1;
    const limit = Number.isFinite(params?.limit) && (params?.limit ?? 0) > 0
      ? Math.floor(params!.limit!)
      : 20;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          participants: { some: { userId } },
        },
        include: {
          participants: {
            include: {
              user: {
                select: this.userSelect,
              },
            },
          },
          messages: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: {
          participants: { some: { userId } },
        },
      }),
    ]);

    return {
      data: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  // ==================================================
  // 3. GET MESSAGES IN A CONVERSATION (PAGINATED)
  // ==================================================
  async getMessages(
    conversationId: string,
    userId: string,
    params?: { page?: number; limit?: number }
  ) {
    // Pagination setup
    const page = Number.isFinite(params?.page) && (params?.page ?? 0) > 0 ? Math.floor(params!.page!) : 1;
    const limit = Number.isFinite(params?.limit) && (params?.limit ?? 0) > 0 ? Math.floor(params!.limit!) : 20;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) throw new NotFoundException('Conversation not found');

    // Mark all unread messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        isRead: false,
        senderId: { not: userId },
      },
      data: { isRead: true },
    });

    // Fetch paginated messages & total count
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          conversationId,
          isDeleted: false,
        },
        include: {
          sender: {
            select: this.userSelect,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          isDeleted: false,
        },
      })
    ]);

    return {
      data: messages.reverse(),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  // ==================================================
  // 4. SEND MESSAGE
  // ==================================================
async sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  attachmentUrl?: string,
) {
  const participant = await this.prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });

  if (!participant) throw new NotFoundException('Conversation not found');

  const allParticipants = await this.prisma.conversationParticipant.findMany({
    where: { conversationId },
    include: { user: { select: { id: true, status: true } } },
  });

  const hasBlockedUser = allParticipants.some((p) => p.user.status === 'BLOCKED');
  if (hasBlockedUser) {
    throw new ForbiddenException('This conversation has been blocked by admin.');
  }

  // ✅ Message save করো
  const message = await this.prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
      attachmentUrl,
    },
    include: {
      sender: { select: this.userSelect },
    },
  });

  await this.prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

  // ==================================================
  // 5. DELETE MESSAGE (Soft Delete)
  // ==================================================
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, senderId: userId },
    });

    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
  }

  // ==================================================
  // 6. UNREAD COUNT
  // ==================================================
  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        conversation: {
          participants: { some: { userId } },
        },
        isRead: false,
        isDeleted: false,
        senderId: { not: userId },
      },
    });

    return { unreadCount: count };
  }

  async markUserOnline(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onlineAt: new Date(), lastSeenAt: null },
    });
  }

  async markUserOffline(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }

  // ==================================================
  // 7. SEARCH USERS FOR NEW CHAT (Only Existing Conversations)
  // ==================================================
  async searchUsers(
    currentUserId: string,
    query: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ) {
    const q = query?.trim();
    const page = Number.isFinite(params?.page) && (params?.page ?? 0) > 0 ? Math.floor(params!.page!) : 1;
    const limit = Number.isFinite(params?.limit) && (params?.limit ?? 0) > 0 ? Math.floor(params!.limit!) : 20;
    const skip = (page - 1) * limit;

    const searchSelect = {
      id: true,
      email: true,
      role: true,
      onlineAt: true,
      lastSeenAt: true,
      jobSeekerProfile: { select: { fullName: true, profilePic: true } },
      employerProfile: { select: { fullName: true, companyName: true, profilePic: true } },
    } as const;

    // ----------------------------------------------------
    // Scenario 1: No query provided (Return recent chats)
    // ----------------------------------------------------
    if (!q) {
      const conversationsPage = await this.getConversationsPaginated(currentUserId, { page, limit });

      const targetUsersMap = conversationsPage.data.map((conversation: any) => {
        const targetParticipant = conversation.participants.find((p: any) => p.userId !== currentUserId);
        return targetParticipant ? { userId: targetParticipant.userId, conversationId: conversation.id } : null;
      }).filter((item): item is { userId: string; conversationId: string } => !!item);

      if (targetUsersMap.length === 0) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false } };
      }

      const targetUserIds = targetUsersMap.map(t => t.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: targetUserIds } },
        select: searchSelect,
      });

      const orderedUsers = targetUsersMap
        .map((target) => {
          const u = users.find((user) => user.id === target.userId);
          return u ? { ...u, conversationId: target.conversationId } : null;
        })
        .filter((u): u is any => !!u);

      return {
        data: orderedUsers,
        meta: {
          total: conversationsPage.meta.total,
          page: conversationsPage.meta.page,
          limit: conversationsPage.meta.limit,
          totalPages: conversationsPage.meta.totalPages,
          hasNextPage: conversationsPage.meta.hasNextPage,
        },
      };
    }

    // ----------------------------------------------------
    // Scenario 2: Search ONLY within existing conversations
    // ----------------------------------------------------

    const userConversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId: currentUserId } },
      },
      select: {
        id: true,
        participants: { select: { userId: true } },
      },
    });

    const targetUserIds: string[] = [];
    const userToConvMap = new Map<string, string>();

    for (const conv of userConversations) {
      const target = conv.participants.find(p => p.userId !== currentUserId);
      if (target) {
        targetUserIds.push(target.userId);
        userToConvMap.set(target.userId, conv.id);
      }
    }

    if (targetUserIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0, hasNextPage: false } };
    }

    const searchWhereClause = {
      id: { in: targetUserIds },
      role: { in: ['JOB_SEEKER', 'EMPLOYER', 'COMPANY'] },
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { jobSeekerProfile: { is: { fullName: { contains: q, mode: 'insensitive' } } } },
        { employerProfile: { is: { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { companyName: { contains: q, mode: 'insensitive' } }] } } },
      ],
    } as any;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: searchWhereClause,
        select: searchSelect,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: searchWhereClause }),
    ]);

    const usersWithConversationId = users.map(user => ({
      ...user,
      conversationId: userToConvMap.get(user.id) || null,
    }));

    return {
      data: usersWithConversationId,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }
  // ==================================================
  // 8. DELETE CONVERSATION
  // ==================================================
  async deleteConversation(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) throw new NotFoundException('Conversation not found');

    const participants = await this.getConversationParticipants(conversationId);

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return {
      success: true,
      message: 'Conversation deleted successfully',
      conversationId,
      participantUserIds: participants.map((p) => p.userId),
    };
  }



  async getConversationParticipants(conversationId: string) {
    return this.prisma.conversationParticipant.findMany({
      where: { conversationId },
    });
  }




  // ==================================================
  // ADMIN —  conversation see
  // ==================================================
  async getAllConversationsAdmin(params?: {
    page?: number;
    limit?: number;
    filter?: 'ALL' | 'EMPLOYER_JOBSEEKER' | 'COMPANY_JOBSEEKER';
  }) {
    const page = params?.page && params.page > 0 ? Math.floor(params.page) : 1;
    const limit = params?.limit && params.limit > 0 ? Math.floor(params.limit) : 20;
    const skip = (page - 1) * limit;


    const whereClause: Prisma.ConversationWhereInput =
      params?.filter === 'EMPLOYER_JOBSEEKER'
        ? {
          AND: [
            { participants: { some: { user: { role: UserRole.EMPLOYER } } } },
            { participants: { some: { user: { role: UserRole.JOB_SEEKER } } } },
          ],
        }
        : params?.filter === 'COMPANY_JOBSEEKER'
          ? {
            AND: [
              { participants: { some: { user: { role: UserRole.COMPANY } } } },
              { participants: { some: { user: { role: UserRole.JOB_SEEKER } } } },
            ],
          }
          : {
            // ALL —  ADMIN 
            participants: {
              every: {
                user: {
                  role: { not: UserRole.ADMIN },
                },
              },
            },
          };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: whereClause,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  ...this.userSelect,
                  status: true, // block status 
                },
              },
            },
          },
          messages: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where: whereClause }),
    ]);

    return {
      data: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  // ==================================================
  // ADMIN —  conversation  messages 
  // ==================================================
  async getConversationMessagesAdmin(
    conversationId: string,
    params?: { page?: number; limit?: number },
  ) {
    const page = params?.page && params.page > 0 ? Math.floor(params.page) : 1;
    const limit = params?.limit && params.limit > 0 ? Math.floor(params.limit) : 50;
    const skip = (page - 1) * limit;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, isDeleted: false },
        include: { sender: { select: this.userSelect } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: { conversationId, isDeleted: false },
      }),
    ]);

    return {
      data: messages.reverse(),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  // ==================================================
  // ADMIN — User block / unblock
  // ==================================================
  async blockUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BLOCKED' },
      select: { id: true, email: true, status: true, role: true },
    });
  }

  async unblockUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
      select: { id: true, email: true, status: true, role: true },
    });
  }

  // ==================================================
  // ADMIN — Conversation  participants  user info
  // ==================================================
  async getConversationWithParticipants(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: { user: { select: { ...this.userSelect, status: true } } },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async getUsersByIds(userIds: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, status: true },
    });
  }
}