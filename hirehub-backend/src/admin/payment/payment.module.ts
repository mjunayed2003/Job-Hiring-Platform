// src/admin/payment/payment.module.ts

import { Module } from '@nestjs/common';
import { AdminPaymentController } from './payment.controller';
import { AdminPaymentService } from './payment.service';

@Module({
  controllers: [AdminPaymentController],
  providers: [AdminPaymentService],
})
export class AdminPaymentModule {}