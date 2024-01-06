import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews/reviews.service';
import { NotionModule } from '../services/notion/notion.module';
import { JobsController } from './jobs.controller';

@Module({
  imports: [NotionModule],
  providers: [ReviewsService],
  controllers: [JobsController],
})
export class JobsModule {}
