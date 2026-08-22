import { Controller, Get, Param, Patch, Put, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/generated/prisma/client';
import { WalletService } from './wallet.service';

@Controller('employer/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class EmployerWalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('withdraw-requests')
  getWithdrawRequests(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletService.getEmployerWithdrawRequests(
      req.user.id,
      status,
      page,
      limit,
    );
  }

  @Patch('withdraw-requests/:id/confirm')
  @Put('withdraw-requests/:id/confirm')
  confirmWithdrawRequest(@Request() req, @Param('id') id: string) {
    return this.walletService.confirmEmployerWithdrawRequest(req.user.id, id);
  }
}
