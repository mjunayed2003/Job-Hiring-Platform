import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FirebaseService {
  private firebaseApp!: App;

  constructor(private readonly prisma: PrismaService) {}

  private getFirebaseApp(): App {
    if (this.firebaseApp) {
      return this.firebaseApp;
    }

    const existing = getApps();
    if (existing.length > 0) {
      this.firebaseApp = existing[0];
      return this.firebaseApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new BadRequestException(
        'Firebase Admin credentials are missing in environment variables',
      );
    }

    this.firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    return this.firebaseApp;
  }

  // Save token for the user if not already stored.
  async saveToken(userId: string, token: string) {
    if (!token) {
      throw new BadRequestException('FCM token is required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.userDeviceToken.upsert({
      where: { token },
      update: { userId },
      create: { userId, token },
    });

    return { message: 'Token saved successfully' };
  }

  // Remove one token during logout.
  async removeToken(userId: string, token: string) {
    if (!token) {
      throw new BadRequestException('FCM token is required');
    }

    await this.prisma.userDeviceToken.deleteMany({
      where: { userId, token },
    });

    return { message: 'Token removed successfully' };
  }

  // Remove all device tokens.
  async removeAllTokens(userId: string) {
    await this.prisma.userDeviceToken.deleteMany({ where: { userId } });
    return { message: 'All tokens removed' };
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const tokens = await this.prisma.userDeviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return { message: 'No device token found for user', success: 0, failure: 0 };
    }

    const app = this.getFirebaseApp();
    const tokenValues = tokens.map((item) => item.token);

    const response = await getMessaging(app).sendEachForMulticast({
      tokens: tokenValues,
      notification: { title, body },
      data,
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      if (
        !result.success &&
        (result.error?.code === 'messaging/registration-token-not-registered' ||
          result.error?.code === 'messaging/invalid-registration-token')
      ) {
        invalidTokens.push(tokenValues[index]);
      }
    });

    if (invalidTokens.length > 0) {
      await this.prisma.userDeviceToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
    }

    return {
      message: 'Notification send attempted',
      success: response.successCount,
      failure: response.failureCount,
      removedInvalidTokens: invalidTokens.length,
    };
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type?: string,
    createdBy?: string,
  ) {
    const payload = type ? { type } : undefined;
    const admins = await this.prisma.user.findMany({
      where: {
        role: 'ADMIN',
        id: { not: userId },
      },
      select: { id: true },
    });

    const recipientIds = [userId, ...admins.map((admin) => admin.id)];

    await this.prisma.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        userId: recipientId,
        createdBy: createdBy ?? userId,
        title,
        message,
        type,
      })),
    });

    const pushResults = await Promise.allSettled(
      recipientIds.map((recipientId) =>
        this.sendNotificationToUser(recipientId, title, message, payload),
      ),
    );

    const fulfilledResults = pushResults
      .filter(
        (result): result is PromiseFulfilledResult<{
          message: string;
          success: number;
          failure: number;
          removedInvalidTokens?: number;
        }> => result.status === 'fulfilled',
      )
      .map((result) => result.value);

    const totalSuccess = fulfilledResults.reduce(
      (sum, result) => sum + result.success,
      0,
    );

    const totalFailure = fulfilledResults.reduce(
      (sum, result) => sum + result.failure,
      0,
    );

    const totalRemovedInvalidTokens = fulfilledResults.reduce(
      (sum, result) => sum + (result.removedInvalidTokens ?? 0),
      0,
    );

    const pushFailedUsers = pushResults.filter(
      (result) => result.status === 'rejected',
    ).length;

    return {
      message: 'Notification stored and push send attempted',
      storedFor: recipientIds.length,
      recipientsTargeted: recipientIds.length,
      recipientsWithPushAttempt: fulfilledResults.length,
      pushFailedUsers,
      success: totalSuccess,
      failure: totalFailure,
      removedInvalidTokens: totalRemovedInvalidTokens,
      adminsTargeted: admins.length,
    };
  }
}
