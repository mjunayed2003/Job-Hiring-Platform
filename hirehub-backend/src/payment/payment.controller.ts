import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  // ==============================================
  // 1. CREATE PAYMENT URL
  // ==============================================
  @UseGuards(JwtAuthGuard)
  @Post('create-url')
  async createPaymentUrl(
    @Body() dto: CreatePaymentDto,
    @Request() req,
  ) {
    return this.paymentService.createPaymentUrl(dto, req.user.id);
  }

  // ============================================
  // 1b. JOBSEEKER MARKS HIRE AS COMPLETED
  // ============================================
  @UseGuards(JwtAuthGuard)
  @Post('interview/:interviewId/complete')
  async markHireCompleted(
    @Param('interviewId') interviewId: string,
    @Request() req,
  ) {
    return this.paymentService.markHireCompleted(req.user.id, interviewId);
  }

  // ============================================
  // 1c. EMPLOYER CONFIRMS JOB COMPLETION
  // ============================================
  @UseGuards(JwtAuthGuard)
  @Post('interview/:interviewId/employer-complete')
  async markEmployerHireCompleted(
    @Param('interviewId') interviewId: string,
    @Request() req,
  ) {
    return this.paymentService.markEmployerHireCompleted(req.user.id, interviewId);
  }

  // ============================================
  // 2. FAC RETURN URL
  // ============================================
  @Post('return')
  async handleReturn(
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    console.log('PowerTranz POST body:', body);
    const result = await this.paymentService.handleReturn(body);
    return res.redirect(result.redirect);
  }
  // ============================================
  // 3. PAYMENT STATUS CHECK
  // ============================================
  @Get('status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }

  // ============================================
  // 4. MY PAYMENTS (Employer)
  // ============================================
  @UseGuards(JwtAuthGuard)
  @Get('my-payments')
  async getMyPayments(@Request() req) {
    return this.paymentService.getMyPayments(req.user.id);
  }
}
