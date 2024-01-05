import { Injectable } from '@nestjs/common';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TodoistService {
  private readonly todoistApi: TodoistApi;
  constructor(configService: ConfigService) {
    const todoistApiKey = configService.getOrThrow<string>('TODOIST_API_KEY');
    this.todoistApi = new TodoistApi(todoistApiKey);
  }

  async createProject() {
    const project = await this.todoistApi.addProject({
      name: 'Mein neues Projekt',
      color: '12',
      viewStyle: 'list',
    });

    await this.todoistApi.addTask({
      projectId: project.id,
      content: 'Mein neues Projekt prüfen',
      labels: 'Automatisch',
    });
  }

  async createTask(title: string, note: string) {
    await this.todoistApi.addTask({
      content: title,
      description: note,
    });
  }
}
