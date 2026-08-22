import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/generated/prisma/client';
import { WalletService } from './wallet.service';
import { WithdrawRequestDto } from './dto/wallet.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.JOB_SEEKER)   // ←  jobseeker access
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.id);
  }

  @Post('withdraw')
  submitWithdraw(@Body() dto: WithdrawRequestDto, @Request() req) {
    return this.walletService.submitWithdrawRequest(req.user.id, dto);
  }

  @Get('withdraw-requests')
  getMyRequests(@Request() req) {
    return this.walletService.getMyWithdrawRequests(req.user.id);
  }
}