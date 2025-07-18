import { Module } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { PerplexityAiModule } from '../perplexity-ai/perplexity-ai.module';
import { NotionAuthService } from './notion-auth/notion-auth.service';
import { ProjectsService } from './projects/projects.service';

@Module({
  providers: [NotionService, NotionAuthService, ProjectsService],
  controllers: [NotionController],
  exports: [NotionService],
  imports: [PerplexityAiModule],
})
export class NotionModule {}
