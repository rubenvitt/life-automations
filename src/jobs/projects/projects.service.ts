import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotionService } from '../../services/notion/notion.service';
import { SettingsService } from '../../settings/settings.service';
import { TodoistService } from '../../services/todoist/todoist.service';
import { formatISO, max, toDate } from 'date-fns';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectsService {
  private readonly logger: Logger = new Logger(ProjectsService.name);

  constructor(
    private readonly notionService: NotionService,
    private readonly settingsService: SettingsService,
    private readonly todoistService: TodoistService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncNotionProjectsToTodoist() {
    this.logger.log(
      '[Cron]: Syncing Notion Projects and Lebensbereiche to Todoist',
    );

    // First, sync ALL active Lebensbereiche to ensure they exist in Todoist
    const allActiveLebensbereiche = await this.notionService
      .projectService()
      .findActiveLebensbereiche();

    // Sync all Lebensbereiche that don't have a Todoist ID yet
    for (const lebensbereich of allActiveLebensbereiche.results) {
      const todoistProjectId =
        lebensbereich['properties']['Todoist Projekt']['rich_text'][0]?.[
          'plain_text'
        ];

      if (!todoistProjectId) {
        this.logger.log(
          `Creating Lebensbereich in Todoist: ${lebensbereich['properties']['Thema']['title'][0]['plain_text']}`,
        );
        const todoistProject = await this.todoistService.createProject(
          lebensbereich['properties']['Thema']['title'][0]['plain_text'],
          'lebensbereich',
        );
        await this.notionService
          .projectService()
          .updateTodoistProject(lebensbereich.id, todoistProject.id);
      }
    }

    const lastSyncDate =
      (await this.settingsService.findSilently('notion', 'last-new-project')) ??
      this.configService.getOrThrow('NOTION_LAST_NEW_PROJECT_INITIAL');

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

    this.logger.log('last project: ' + lastProjectDateString);
    this.logger.log('last lebensbereich: ' + lastLebensbereichDateString);
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

      let todoistLebensbereichId =
        lebensbereich?.['properties']['Todoist Projekt']['rich_text'][0]?.[
          'plain_text'
        ];

      // If Lebensbereich exists in Notion but not in Todoist, create it first
      if (lebensbereich && !todoistLebensbereichId) {
        this.logger.log(
          `Creating missing Lebensbereich in Todoist: ${lebensbereich['properties']['Thema']['title'][0]['plain_text']}`,
        );
        const todoistLebensbereich = await this.todoistService.createProject(
          lebensbereich['properties']['Thema']['title'][0]['plain_text'],
          'lebensbereich',
        );
        await this.notionService
          .projectService()
          .updateTodoistProject(lebensbereich.id, todoistLebensbereich.id);
        todoistLebensbereichId = todoistLebensbereich.id;
      }

      const todoistProject = await this.todoistService.createProject(
        project['properties']['Projekt']['title'][0]['plain_text'],
        'project',
        todoistLebensbereichId ??
          this.configService.getOrThrow('TODOIST_DEFAULT_PROJECT'),
      );
      await this.notionService
        .projectService()
        .updateTodoistProject(project.id, todoistProject.id);
    });

    // We already synced all Lebensbereiche at the beginning, so we can skip this part
    // Only log the newly created ones for tracking purposes
    this.logger.log(
      `Found ${activeLebensbereiche.results.length} new Lebensbereiche since last sync`,
    );

    this.logger.log('Found projects in Notion:', activeProjects.results.length);
    this.logger.log(
      'Found lebensbereiche in Notion:',
      activeLebensbereiche.results.length,
    );
  }
}
