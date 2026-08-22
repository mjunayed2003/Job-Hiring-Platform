import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Patch,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/admin/admin-auth/guards/roles.guard';
import { Roles } from 'src/admin/admin-auth/decorators/roles.decorator';
import { UserRole } from 'src/generated/prisma/client';
import { CreateSubscriptionPlanDto } from './dto/subcription.dto';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // GET /admin/subscriptions
  @Get()
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  // GET /admin/subscriptions/company/:userId
  @Get('company/:userId')
  getCompanySubscription(@Param('userId') userId: string) {
    return this.subscriptionService.getCompanySubscription(userId);
  }

  // POST /admin/subscriptions
  @Post()
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createPlan(dto);
  }

  // PUT /admin/subscriptions/:id
  @Put(':id')
  updatePlan(@Param('id') id: string, @Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.updatePlan(id, dto);
  }

  // DELETE /admin/subscriptions/:id
  @Delete(':id')
  deletePlan(@Param('id') id: string) {
    return this.subscriptionService.deletePlan(id);
  }

  // POST /admin/subscriptions/company/:userId/assign
  @Post('company/:userId/assign')
  assignCompanySubscription(
    @Param('userId') userId: string,
    @Body() body: { planId?: string; startDate?: string; expiryDate?: string; transactionId?: string; amount?: string | number; currency?: string; slotsOverride?: string | number },
  ) {
    return this.subscriptionService.assignCompanySubscription(userId, body);
  }

  // PATCH /admin/subscriptions/company/:userId/activate
  @Patch('company/:userId/activate')
  activateCompanySubscription(
    @Param('userId') userId: string,
    @Body() body: { planId?: string; startDate?: string; expiryDate?: string; transactionId?: string; amount?: string | number; currency?: string; slotsOverride?: string | number },
  ) {
    return this.subscriptionService.activateCompanySubscription(userId, body);
  }

  // PATCH /admin/subscriptions/company/:userId/extend
  @Patch('company/:userId/extend')
  extendCompanySubscription(
    @Param('userId') userId: string,
    @Body() body: { extendDays?: string | number; transactionId?: string; amount?: string | number; currency?: string; expiryDate?: string; slotsOverride?: string | number },
  ) {
    return this.subscriptionService.extendCompanySubscription(userId, body);
  }

  // PATCH /admin/subscriptions/company/:userId/modify
  @Patch('company/:userId/modify')
  modifyCompanySubscription(
    @Param('userId') userId: string,
    @Body() body: { planId?: string; startDate?: string; expiryDate?: string; isActive?: boolean | string; transactionId?: string; amount?: string | number; currency?: string; slotsOverride?: string | number },
  ) {
    return this.subscriptionService.modifyCompanySubscription(userId, body);
  }

  // PATCH /admin/subscriptions/company/:userId/cancel
  @Patch('company/:userId/cancel')
  cancelCompanySubscription(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.subscriptionService.cancelCompanySubscription(userId, body);
  }
}
