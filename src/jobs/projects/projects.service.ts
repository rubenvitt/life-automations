import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotionService } from '../../services/notion/notion.service';
import { SettingsService } from '../../settings/settings.service';
import { TodoistService } from '../../services/todoist/todoist.service';
import { formatISO, max, toDate } from 'date-fns';

@Injectable()
export class ProjectsService {
  private readonly logger: Logger = new Logger(ProjectsService.name);

  constructor(
    private readonly notionService: NotionService,
    private readonly settingsService: SettingsService,
    private readonly todoistService: TodoistService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncNotionProjectsToTodoist() {
    this.logger.log(
      '[Cron]: Syncing Notion Projects and Lebensbereiche to Todoist',
    );
    const lastSyncDate = await this.settingsService.findSilently(
      'notion',
      'last-new-project',
    );

    const activeProjects = await this.notionService
      .projectService()
      .findActiveProjectsSince(lastSyncDate);
    const activeLebensbereiche = await this.notionService
      .projectService()
      .findActiveLebensbereicheSince(lastSyncDate);

    const lastProjectDateString =
      activeProjects.results[activeProjects.results.length - 1]?.['properties'][
        'Erstellt um'
      ]['created_time'];
    const lastLebensbereichDateString =
      activeLebensbereiche.results[activeProjects.results.length - 1]?.[
        'properties'
      ]['created_time'];

    this.logger.log('last project: ' + lastProjectDateString ?? 'unknown');
    this.logger.log(
      'last lebensbereich: ' + lastLebensbereichDateString ?? 'unknown',
    );
    if (lastLebensbereichDateString || lastProjectDateString) {
      const lastLebensbereichDate = toDate(lastLebensbereichDateString ?? 0);
      const lastProjectDate = toDate(lastProjectDateString ?? 0);
      const lastDate = formatISO(max([lastLebensbereichDate, lastProjectDate]));
      this.logger.log('last date is ' + lastDate);

      await this.settingsService.update('notion', {
        key: 'last-new-project',
        value: lastDate,
      });
    }
    activeProjects.results.map(async (project) => {
      const lebensbereich = await this.notionService
        .projectService()
        .findLebensbereich(
          project['properties']['Lebensbereich']['relation'][0]?.['id'],
        );
      const todoistLebensbereich =
        lebensbereich?.['properties']['Todoist Projekt']['rich_text'][0][
          'plain_text'
        ];
      const todoistProject = await this.todoistService.createProject(
        project['properties']['Projekt']['title'][0]['plain_text'],
        'project',
        todoistLebensbereich ??
          (await this.settingsService.findOrWarn('todoist', 'default-project')),
      );
      await this.notionService
        .projectService()
        .updateTodoistProject(project.id, todoistProject.id);
    });

    activeLebensbereiche.results.map(async (lebensbereich) => {
      const todoistProject = await this.todoistService.createProject(
        lebensbereich['properties']['Thema']['title'][0]['plain_text'],
        'lebensbereich',
      );
      await this.notionService
        .projectService()
        .updateTodoistProject(lebensbereich.id, todoistProject.id);
    });

    this.logger.log('Found projects in Notion:', activeProjects.results.length);
    this.logger.log(
      'Found lebensbereiche in Notion:',
      activeLebensbereiche.results.length,
    );
  }
}
