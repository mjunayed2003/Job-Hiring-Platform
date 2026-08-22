import {
  Body, Controller, Delete, Get, Param, Post, Put,
  Query, Request, UploadedFile, UploadedFiles,
  UseGuards, UseInterceptors
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JobSeekerService } from './job-seeker.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApplyJobDto, ReportJobDto } from './dto/job-action.dto';
import { UpdateProfileDto } from './dto/profile.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('jobs')
export class JobSeekerController {
  constructor(private readonly jobSeekerService: JobSeekerService) { }

  // Static routes
  // PUBLIC: Get all jobs with pagination
  @Get()
  async getAllJobs(@Request() req, @Query() query) {
    return this.jobSeekerService.getAllJobs(query, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookmarks')
  async getBookmarkedJobs(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.jobSeekerService.getBookmarkedJobs(req.user.id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-applications')
  async getMyApplications(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.jobSeekerService.getMyApplications(req.user.id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  // DELETE ROUTE HERE
  @UseGuards(JwtAuthGuard)
  @Delete('applications/:applicationId')
  async deleteApplication(
    @Param('applicationId') applicationId: string,
    @Request() req,
  ) {
    return this.jobSeekerService.deleteApplication(req.user.id, applicationId);
  }


  // PUBLIC: Get job details without authentication
  @Get(':id/details')
  async getJobDetails(@Param('id') id: string, @Request() req) {
    return this.jobSeekerService.getJobDetails(id, req.user?.id, req.headers);
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `resume-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
          return cb(new Error('Only PDF and DOC files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )



  async applyJob(
    @Body() dto: ApplyJobDto,
    @UploadedFile() resume: Express.Multer.File,
    @Request() req,
  ) {
    const resumeUrl = resume ? `/uploads/${resume.filename}` : dto.resumeUrl ?? null;
    return this.jobSeekerService.applyJob(req.user.id, dto, resumeUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/bookmark')
  async toggleBookmark(@Param('id') jobId: string, @Request() req) {
    return this.jobSeekerService.toggleBookmark(req.user.id, jobId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('report')
  async reportJob(@Body() dto: ReportJobDto, @Request() req) {
    return this.jobSeekerService.reportJob(req.user.id, dto);
  }



  @UseGuards(JwtAuthGuard)
  @Get('interviews/:interviewId')
  async getInterviewDetails(
    @Param('interviewId') interviewId: string,
    @Request() req,
  ) {
    return this.jobSeekerService.getInterviewDetails(req.user.id, interviewId);
  }

  // ==================================================
  // PROFILE ROUTES
  // ==================================================

  // 1. GET PROFILE
  // URL: GET /jobs/profile
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.jobSeekerService.getProfile(req.user.id);
  }

  // 2. UPDATE PROFILE
  // URL: PUT /jobs/profile
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePic', maxCount: 1 },
      { name: 'resume', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @UploadedFiles() files: {
      profilePic?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    const profilePic = files?.profilePic?.[0]
      ? `/uploads/${files.profilePic[0].filename}`
      : null;
    const resumeUrl = files?.resume?.[0]
      ? `/uploads/${files.resume[0].filename}`
      : null;
    return this.jobSeekerService.updateProfile(req.user.id, dto, profilePic, resumeUrl);
  }

}
