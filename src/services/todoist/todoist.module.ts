import { Module } from '@nestjs/common';
import { TodoistService } from './todoist.service';
import { TodoistController } from './todoist.controller';

@Module({
  providers: [TodoistService],
  controllers: [TodoistController],
  exports: [TodoistService],
})
export class TodoistModule {}
