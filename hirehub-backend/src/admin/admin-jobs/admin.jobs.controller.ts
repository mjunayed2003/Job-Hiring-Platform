import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { AdminJobsService } from './admin.jobs.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../admin-auth/guards/roles.guard';
import { Roles } from '../admin-auth/decorators/roles.decorator';
import { UserRole } from 'src/generated/prisma/client';
import { AdminJobsQueryDto } from './dto/jobs-query.dto';
import { ApplicationsQueryDto } from './dto/applications-query.dto';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminJobsController {
  constructor(private readonly adminJobsService: AdminJobsService) { }

  // GET /admin/jobs
  @Get()
  getJobs(@Query() query: AdminJobsQueryDto) {
    return this.adminJobsService.getJobs(query);
  }

  // GET /admin/jobs/:id
  @Get(':id')
  getJobById(@Param('id') id: string) {
    return this.adminJobsService.getJobById(id);
  }


  // GET /admin/jobs/:id/applications
  @Get(':id/applications')
  getJobApplications(
    @Param('id') id: string,
    @Query() query: ApplicationsQueryDto,
  ) {
    return this.adminJobsService.getJobApplications(id, query);
  }

  // PATCH /admin/jobs/:id/block
  @Patch(':id/block')
  blockJob(@Param('id') id: string) {
    return this.adminJobsService.blockJob(id);
  }

  // PATCH /admin/jobs/:id/unblock
  @Patch(':id/unblock')
  unblockJob(@Param('id') id: string) {
    return this.adminJobsService.unblockJob(id);
  }


  // DELETE /admin/jobs/:id
  @Delete(':id')
  deleteJob(@Param('id') id: string) {
    return this.adminJobsService.deleteJob(id);
  }
}