// src/admin/payment/payment.controller.ts

import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminPaymentService } from './payment.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../admin-auth/guards/roles.guard';
import { Roles } from '../admin-auth/decorators/roles.decorator';
import { UserRole, PaymentStatus } from '../../generated/prisma/client';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPaymentController {
    constructor(private readonly adminPaymentService: AdminPaymentService) { }

    /**
     * GET /admin/payments
     * ?search=john  &status=PENDING  &page=1  &limit=10
     */
    @Get()
    getAllPayments(
        @Query('search') search?: string,
        @Query('status') status?: PaymentStatus,
        @Query('type') type?: 'JOB_PAYMENT' | 'SUBSCRIPTION', // 👈 add
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.adminPaymentService.getAllPayments(search, status, type, page, limit);
    }

    /**
     * PATCH /admin/payments/:id/fail
     * Only PENDING payments can be failed — PAID ones are blocked
     */
    @Patch(':id/fail')
    markAsFailed(
        @Param('id') id: string,
        @Query('type') type: 'job' | 'subscription' = 'job',
    ) {
        return this.adminPaymentService.markAsFailed(id, type);
    }
}