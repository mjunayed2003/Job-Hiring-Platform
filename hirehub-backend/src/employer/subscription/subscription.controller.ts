import { Body, Controller, Get, Delete, Param, Post, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SubscriptionService } from './subscription.service';
import { PurchaseSubscriptionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { CreateSubscriptionPaymentDto } from './dto/subscription-payment.dto';


@Controller('employer/subscriptions')
export class SubscriptionController {
  constructor(private subService: SubscriptionService) { }

  @Get('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  getPlans() {
    return this.subService.getAvailablePlans();
  }

  // Fallback endpoint - normally subscription is activated automatically via webhook
  // Use this only if webhook fails to process payment return
  @Post('purchase')
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  purchase(@Request() req, @Body() dto: PurchaseSubscriptionDto) {
    return this.subService.purchasePlan(req.user.id, dto.planId);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  getActive(@Request() req) {
    return this.subService.getActiveSub(req.user.id);
  }

  @Get('paid-usable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  getPaidUsable(@Request() req) {
    return this.subService.getPaidUsableSubscriptions(req.user.id);
  }

  @Post('switch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  switchSubscription(@Request() req, @Body() body: { orderId: string }) {
    return this.subService.switchToPaidSubscription(req.user.id, body.orderId);
  }


  @Post('payment/create-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  createPaymentUrl(
    @Request() req,
    @Body() dto: CreateSubscriptionPaymentDto,
  ) {
    return this.subService.createSubscriptionPaymentUrl(req.user.id, dto);
  }

  // PowerTranz return - public (no guard)
  @Post('return')
  @Post('payment/return')
  async handleReturn(
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    const result = await this.subService.handleSubscriptionReturn(body);
    return res.redirect(result.redirect);
  }

  @Post('webhook')
  async handleWebhook(
    @Body() body: Record<string, string>,
    @Request() req,
  ) {
    return this.subService.handleSubscriptionWebhook(body, req.headers);
  }


  // admin/subscriptions controller এ
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteSubscription(@Param('id') id: string) {
    return this.subService.deleteSubscription(id);
  }
}
