import { Module } from '@nestjs/common';
import { NotionModule } from './notion/notion.module';
import { TodoistModule } from './todoist/todoist.module';

@Module({
  imports: [NotionModule, TodoistModule]
})
export class ServicesModule {}
