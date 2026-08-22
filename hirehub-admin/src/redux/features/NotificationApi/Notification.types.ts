// src/types/notification.types.ts

export interface NotificationItem {
  id: string;
  message: string;
  title?: string;
  time: string;
  date: string;
  isRead: boolean;
  logo: string;
  createdAt?: string;
  senderName?: string;
  senderProfilePic?: string | null;
  type?: string;
  link?: string | null;
}

export interface BackendNotification {
  id: string;
  userId: string;
  title?: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  createdBy?: string;
  senderName?: string;
  senderProfilePic?: string | null;
  time?: string;
  createdByUser?: {
    id: string;
    email?: string;
    adminProfile?: {
      fullName?: string;
      profilePic?: string;
    };
    jobSeekerProfile?: {
      fullName?: string;
      profilePic?: string;
    };
    employerProfile?: {
      companyName?: string;
      fullName?: string;
      profilePic?: string;
    };
  };
}

export interface NotificationsResponse {
  data: BackendNotification[];
  pagination?: {
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface DeleteNotificationResponse {
  success: boolean;
}

export interface MarkAsReadResponse {
  updated?: number;
}
