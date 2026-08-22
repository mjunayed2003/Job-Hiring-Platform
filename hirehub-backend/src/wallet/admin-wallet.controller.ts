import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/admin/admin-auth/guards/roles.guard';
import { Roles } from 'src/admin/admin-auth/decorators/roles.decorator';
import { UserRole } from 'src/generated/prisma/client';
import { AdminWalletService } from './admin-wallet.service';
import { AdminWithdrawActionDto } from './dto/wallet.dto';

@Controller('admin/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminWalletController {
  constructor(private readonly adminWalletService: AdminWalletService) {}

  // GET /admin/wallet/withdraw-requests?status=PENDING&page=1&limit=10
  @Get('withdraw-requests')
  getAllRequests(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminWalletService.getAllWithdrawRequests(status, page, limit);
  }

  // PATCH /admin/wallet/withdraw-requests/:id
  @Patch('withdraw-requests/:id')
  processRequest(
    @Param('id') id: string,
    @Body() dto: AdminWithdrawActionDto,
  ) {
    return this.adminWalletService.processWithdrawRequest(id, dto);
  }
}