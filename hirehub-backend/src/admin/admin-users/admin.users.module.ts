import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin.users.controller';
import { AdminUsersService } from './admin.users.service';
import { MailModule } from '../admin-mail/mail.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '6h' },
      }),
    }),
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
