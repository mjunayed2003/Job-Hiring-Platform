import { Controller, Get } from '@nestjs/common';
import { JobSeekerService } from 'src/job-seeker/job-seeker.service';

@Controller('public/jobs')
export class PublicJobController {
  constructor(private readonly jobSeekerService: JobSeekerService) {}

  @Get()
  async getLatestJobs() {
    return this.jobSeekerService.getLatestPublicJobs();
  }
}