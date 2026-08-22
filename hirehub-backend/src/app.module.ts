import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { JobSeekerModule } from './job-seeker/job-seeker.module';
import { EmployerModule } from './employer/employer.module';
import { CategoryModule } from './category/category.module';
import { UploadController } from './upload/upload.controller';
import { PublicModule } from './public/public.module';
import { MessagesModule } from './messages/messages.module';
import { PaymentModule } from './payment/payment.module';
import { DashboardModule } from './admin/dashboard/dashboard.module';
import { AdminAuthModule } from './admin/admin-auth/admin.auth.module';
import { AdminUsersModule } from './admin/admin-users/admin.users.module';
import { AdminReportsModule } from './admin/admin-reports/admin.reports.module';
import { AdminProfileModule } from './admin/admin-profile/admin.profile.module';
import { AdminJobsModule } from './admin/admin-jobs/admin.jobs.module';
import { SubscriptionModule } from './admin/subscription/subscription.module';
import { AdminInterviewsModule } from './admin/admin.interviews/admin.interviews.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminPaymentModule } from './admin/payment/payment.module';
import { AdminSettingsModule } from './admin/settings/settings.module';
import { SupportModule } from './support/support.module';
import Mail from 'nodemailer/lib/mailer';
import { MailModule } from './admin/admin-mail/mail.module';
import { WalletModule } from './wallet/wallet.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,



    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"Job Portal Support" <${process.env.MAIL_FROM}>`,
      },
    }),
    JobSeekerModule,
    EmployerModule,
    CategoryModule,
    PublicModule,
    MessagesModule,
    PaymentModule,
    DashboardModule,
    AdminAuthModule,
    AdminUsersModule,
    AdminReportsModule,
    AdminProfileModule,
    AdminJobsModule,
    SubscriptionModule,
    AdminInterviewsModule,
    FirebaseModule,
    NotificationsModule,
    AdminPaymentModule,
    AdminSettingsModule,
    SupportModule,
    MailModule,
    WalletModule,
  ],
  controllers: [AppController, UploadController],
  providers: [AppService],
})
export class AppModule { }