import { Module } from '@nestjs/common';
import { EmployerController } from './employer.controller';
import { EmployerService } from './employer.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SubscriptionController } from './subscription/subscription.controller';
import { SubscriptionService } from './subscription/subscription.service';
import { MailModule } from 'src/admin/admin-mail/mail.module';

@Module({
  imports: [FirebaseModule, SubscriptionModule, MailModule],
  controllers: [EmployerController, SubscriptionController],
  providers: [EmployerService, SubscriptionService],
})
export class EmployerModule {}