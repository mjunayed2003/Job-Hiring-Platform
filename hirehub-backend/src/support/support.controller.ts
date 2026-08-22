// src/support/support.controller.ts

import { Body, Controller, Get, Post, Patch, Query, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/admin-auth/guards/roles.guard';
import { Roles } from '../admin/admin-auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  //  Public — Get the  POST
  @Post()
  create(@Body() dto: CreateSupportDto) {
    return this.supportService.create(dto);
  }

  //Admin only —  admin GET 
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.supportService.findAll(page, limit);
  }


//  Admin — Contact Info update
@Patch('contact-info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
updateContactInfo(@Body() body: { email?: string; phone?: string }) {
  return this.supportService.upsertContactInfo(body);
}

//  Public — User get contact info
@Get('contact-info')
getContactInfo() {
  return this.supportService.getContactInfo();
}
}