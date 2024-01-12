import { Injectable, Logger } from '@nestjs/common';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { ConfigService } from '@nestjs/config';

type ProjectColor = 'project' | 'lebensbereich';

const colorMap = {
  project: 'sky_blue',
  lebensbereich: 'orange',
};

@Injectable()
export class TodoistService {
  private readonly logger: Logger = new Logger(TodoistService.name);
  private readonly todoistApi: TodoistApi;
  constructor(configService: ConfigService) {
    const todoistApiKey = configService.getOrThrow<string>('TODOIST_API_KEY');
    this.todoistApi = new TodoistApi(todoistApiKey);
  }

  async createProject(
    projectLabel: string,
    projectColor: ProjectColor,
    parentId?: string,
  ) {
    this.logger.log(
      `Creating project with color '${projectColor.valueOf().toString()}'`,
    );
    try {
      const project = await this.todoistApi.addProject({
        name: projectLabel,
        color: colorMap[projectColor],
        viewStyle: 'list',
        parentId,
      });

      await this.todoistApi.addTask({
        projectId: project.id,
        content: 'Mein neues Projekt prüfen',
        labels: ['Automatisch angelegt'],
        dueString: 'heute',
        dueLang: 'de',
      });

      return project;
    } catch (e) {
      console.log('Got error', e);
      throw e;
    }
  }

  async createTask(title: string, note: string) {
    await this.todoistApi.addTask({
      content: title,
      description: note,
    });
  }
}
