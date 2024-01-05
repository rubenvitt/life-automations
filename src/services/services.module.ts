import { Module } from '@nestjs/common';
import { NotionModule } from './notion/notion.module';
import { TodoistModule } from './todoist/todoist.module';
import { OpenaiModule } from './openai/openai.module';
import { PerplexityAiModule } from './perplexity-ai/perplexity-ai.module';

@Module({
  imports: [NotionModule, TodoistModule, OpenaiModule, PerplexityAiModule],
})
export class ServicesModule {}
