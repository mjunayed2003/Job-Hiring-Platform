import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../admin-auth/guards/roles.guard';
import { Roles } from '../admin-auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { SendMailDto } from './dto/mail.dto';

@Controller('admin/send-mail')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MailController {
  constructor(private readonly mailService: MailService) { }

  // ─────────────────────────────────────────────────────
  // POST /admin/send-mail
  // Body: { to: string, subject: string, message: string }
  // ─────────────────────────────────────────────────────
  @Post()
  async sendMail(@Body() dto: SendMailDto) {
    if (!dto.to || !dto.subject || !dto.message) {
      throw new Error('Missing required fields: to, subject, or message');
    }
    await this.mailService.sendMail(dto);
    return { success: true, message: 'Email sent successfully.' };
  }
}