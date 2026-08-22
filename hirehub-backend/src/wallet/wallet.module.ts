import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { AdminWalletController } from './admin-wallet.controller';
import { AdminWalletService } from './admin-wallet.service';
import { EmployerWalletController } from './employer-wallet.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/admin/admin-mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [WalletController, AdminWalletController, EmployerWalletController],
  providers: [WalletService, AdminWalletService],
  exports: [WalletService],
})
export class WalletModule {}

// coment
