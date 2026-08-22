import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.notificationsService.getNotifications(req.user.id, Number(skip), Number(take));
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(req.user.id, notificationId);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') notificationId: string) {
    return this.notificationsService.deleteNotification(req.user.id, notificationId);
  }
}
