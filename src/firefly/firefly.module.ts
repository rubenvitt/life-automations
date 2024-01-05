import { Module } from '@nestjs/common';
import { FireflyService } from './firefly.service';
import { FireflyController } from './firefly.controller';
import { NotionModule } from '../services/notion/notion.module';
import { TodoistModule } from '../services/todoist/todoist.module';

@Module({
  providers: [FireflyService],
  controllers: [FireflyController],
  imports: [NotionModule, TodoistModule],
  exports: [FireflyService],
})
export class FireflyModule {}
