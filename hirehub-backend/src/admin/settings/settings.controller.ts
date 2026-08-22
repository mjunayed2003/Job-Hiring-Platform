import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AdminSettingsService } from './settings.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../admin-auth/guards/roles.guard';
import { Roles } from '../admin-auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get('platform-fee')
  getPlatformFee() {
    return this.settingsService.getPlatformFee();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('platform-fee')
  setPlatformFee(@Body('percent') percent: number) {
    return this.settingsService.setPlatformFee(percent);
  }
}
