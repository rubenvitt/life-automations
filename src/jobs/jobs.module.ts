import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews/reviews.service';
import { NotionModule } from '../services/notion/notion.module';
import { JobsController } from './jobs.controller';
import { ProjectsService } from './projects/projects.service';
import { TodoistModule } from '../services/todoist/todoist.module';

@Module({
  imports: [NotionModule, TodoistModule],
  providers: [ReviewsService, ProjectsService],
  controllers: [JobsController],
})
export class JobsModule {}
