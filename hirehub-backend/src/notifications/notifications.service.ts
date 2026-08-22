import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type?: string,
    createdBy?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        createdBy,
      },
    });
  }

  async getNotifications(userId: string, skip = 0, take = 20) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
          createdBy: true,
          createdByUser: {
            select: {
              id: true,
              email: true,
              adminProfile: {
                select: { fullName: true, profilePic: true },
              },
              jobSeekerProfile: {
                select: { fullName: true, profilePic: true },
              },
              employerProfile: {
                select: { fullName: true, profilePic: true },
              },
            },
          },
        },
      });

      const formattedNotifications = notifications.map((item) => {
        const senderProfile =
          item.createdByUser?.adminProfile ||
          item.createdByUser?.jobSeekerProfile ||
          item.createdByUser?.employerProfile;

        return {
          id: item.id,
          senderName: senderProfile?.fullName || 'System',
          senderProfilePic: senderProfile?.profilePic || null,
          title: item.title || senderProfile?.fullName || 'System',
          message: item.message,
          type: item.type || null,
          isRead: item.isRead,
          time: item.createdAt,
        };
      });

      const total = await this.prisma.notification.count({
        where: { userId },
      });

      return {
        data: formattedNotifications,
        pagination: {
          total,
          skip,
          take,
          hasMore: skip + take < total,
        },
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new BadRequestException({
        message: 'Failed to fetch notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });

      return { unreadCount: count };
    } catch (error) {
      throw new BadRequestException('Failed to fetch unread count');
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== userId) {
        throw new BadRequestException('Notification not found');
      }

      const updated = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return updated;
    } catch (error) {
      throw new BadRequestException('Failed to mark notification as read');
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return { updated: result.count };
    } catch (error) {
      throw new BadRequestException('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(userId: string, notificationId: string) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== userId) {
        throw new BadRequestException('Notification not found');
      }

      await this.prisma.notification.delete({
        where: { id: notificationId },
      });

      return { success: true };
    } catch (error) {
      throw new BadRequestException('Failed to delete notification');
    }
  }
}
