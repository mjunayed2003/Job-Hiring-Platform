import { Module } from '@nestjs/common';
import { JobSeekerController } from './job-seeker.controller';
import { JobSeekerService } from './job-seeker.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { RolesGuard } from 'src/auth/roles.guard';
import { PublicJobController } from './public-job.controller';
import { MailModule } from 'src/admin/admin-mail/mail.module';

@Module({
  imports: [
    FirebaseModule,
    MailModule,
  ],
  controllers: [JobSeekerController, PublicJobController],
  providers: [JobSeekerService, RolesGuard],
})
export class JobSeekerModule {}
