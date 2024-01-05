import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews/reviews.service';
import { NotionModule } from '../services/notion/notion.module';

@Module({
  imports: [NotionModule],
  providers: [ReviewsService],
})
export class JobsModule {}
