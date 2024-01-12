import { Controller, Post } from '@nestjs/common';
import { ReviewsService } from './reviews/reviews.service';
import { ProjectsService } from './projects/projects.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('/reviews')
  startReviewsCron() {
    return this.reviewsService.reviewsCron();
  }

  @Post('/projects')
  startProjectReviewConnectionCron() {
    return this.reviewsService.projectReviewConnectionCron();
  }

  @Post('/projects-to-notion')
  startSyncNotionProjectsToTodoist() {
    return this.projectsService.syncNotionProjectsToTodoist();
  }
}
