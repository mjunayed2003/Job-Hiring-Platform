import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminUsersService } from './admin.users.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../admin-auth/guards/roles.guard';
import { Roles } from '../admin-auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { UsersQueryDto } from './dto/users-query.dto';
import { RejectUserDto } from './dto/reject-user.dto';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // ─────────────────────────────────────────────────────
  // GET /admin/users?role=JOB_SEEKER&status=PENDING&page=1&limit=10
  // ─────────────────────────────────────────────────────
  @Get()
  getUsers(@Query() query: UsersQueryDto) {
    return this.adminUsersService.getUsers(query);
  }

  // ─────────────────────────────────────────────────────
  // GET /admin/users/:id
  // ─────────────────────────────────────────────────────
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /admin/users/:id/approve
  // ─────────────────────────────────────────────────────
  @Patch(':id/approve')
  approveUser(@Param('id') id: string) {
    return this.adminUsersService.approveUser(id);
  }

  // ─────────────────────────────────────────────────────
  // POST /admin/users/:id/verification-backup-link
  // ─────────────────────────────────────────────────────
  @Post(':id/verification-backup-link')
  sendVerificationBackupLink(@Param('id') id: string) {
    return this.adminUsersService.sendVerificationBackupLink(id);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /admin/users/:id/verification-backup
  // ─────────────────────────────────────────────────────
  @Patch(':id/verification-backup')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'idCardFront', maxCount: 1 },
        { name: 'idCardBack', maxCount: 1 },
        { name: 'selfieImage', maxCount: 1 },
        { name: 'licenseFile', maxCount: 1 },
      ],
      { storage },
    ),
  )
  uploadVerificationBackup(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      idCardFront?: Express.Multer.File[];
      idCardBack?: Express.Multer.File[];
      selfieImage?: Express.Multer.File[];
      licenseFile?: Express.Multer.File[];
    },
  ) {
    return this.adminUsersService.uploadVerificationBackup(id, files);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /admin/users/:id/reject
  // ─────────────────────────────────────────────────────
  @Patch(':id/reject')
  rejectUser(@Param('id') id: string, @Body() dto: RejectUserDto) {
    return this.adminUsersService.rejectUser(id, dto.reason);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /admin/users/:id/block
  // ─────────────────────────────────────────────────────
  @Patch(':id/block')
  blockUser(@Param('id') id: string, @Body() dto: RejectUserDto) {
    return this.adminUsersService.blockUser(id, dto.reason);
  }

  // ─────────────────────────────────────────────────────
  // PATCH /admin/users/:id/pending (Unblock user)
  // ─────────────────────────────────────────────────────
  @Patch(':id/pending')
  pendingUser(@Param('id') id: string) {
    return this.adminUsersService.pendingUser(id);
  }

  // ─────────────────────────────────────────────────────
  // DELETE /admin/users/:id
  // ─────────────────────────────────────────────────────
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.adminUsersService.deleteUser(id);
  }
}
