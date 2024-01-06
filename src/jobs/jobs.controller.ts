import { Controller, Post } from '@nestjs/common';
import { ReviewsService } from './reviews/reviews.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('/reviews')
  startReviewsCron() {
    return this.reviewsService.reviewsCron();
  }

  @Post('/projects')
  startProjectReviewConnectionCron() {
    return this.reviewsService.projectReviewConnectionCron();
  }
}
