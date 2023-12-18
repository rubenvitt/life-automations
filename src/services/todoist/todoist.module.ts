import { Module } from '@nestjs/common';
import { TodoistService } from './todoist.service';

@Module({
  providers: [TodoistService]
})
export class TodoistModule {}
