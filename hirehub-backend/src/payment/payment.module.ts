import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WalletModule } from 'src/wallet/wallet.module';  // ← add
import { NotificationsModule } from 'src/notifications/notifications.module';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { MailModule } from 'src/admin/admin-mail/mail.module';

@Module({
  imports: [PrismaModule, WalletModule, NotificationsModule, FirebaseModule, MailModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
