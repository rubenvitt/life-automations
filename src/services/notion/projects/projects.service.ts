import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { NotionAuthService } from '../notion-auth/notion-auth.service';
import { SettingsService } from '../../../settings/settings.service';
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

const statusActiveFilter = {
  or: [
    {
      property: 'Status',
      status: {
        equals: 'Aktiv',
      },
    },
    {
      property: 'Status',
      status: {
        equals: 'In Bearbeitung',
      },
    },
  ],
};

@Injectable()
export class ProjectsService {
  private readonly logger: Logger = new Logger(ProjectsService.name);
  private readonly notion: Client;
  private _projectsDb: string;
  private _lebensbereichDb: string;

  constructor(
    notionAuthService: NotionAuthService,
    settingsService: SettingsService,
  ) {
    this.notion = notionAuthService.notion();

    settingsService.findOrWarn('notion', 'projects').then((databaseId) => {
      this._projectsDb = databaseId;
    });
    settingsService
      .findOrWarn('notion', 'lebensbereiche')
      .then((databaseId) => {
        this._lebensbereichDb = databaseId;
      });
  }

  async findLebensbereich(lebensbereichId?: string) {
    if (!lebensbereichId) {
      return null;
    }
    return await this.notion.pages.retrieve({
      page_id: lebensbereichId,
    });
  }

  async findActiveProjects() {
    return await this.notion.databases.query({
      database_id: this._projectsDb,
      filter: statusActiveFilter,
    });
  }

  async findActiveLebensbereiche() {
    return await this.notion.databases.query({
      database_id: this._lebensbereichDb,
      filter: statusActiveFilter,
    });
  }

  async addProjectsToReview(review: string) {
    const activeProjects = await this.findActiveProjects();

    await this.notion.pages.update({
      page_id: review,
      properties: {
        Projekte: {
          relation: activeProjects.results.map((project) => ({
            id: project.id,
          })),
        },
      },
    });
  }

  async findActiveProjectsSince(lastSyncDate: string) {
    let projectsSince: QueryDatabaseResponse;
    if (!lastSyncDate) {
      projectsSince = await this.findActiveProjects();
    } else {
      projectsSince = await this.notion.databases.query({
        database_id: this._projectsDb,
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'ascending',
          },
        ],
        filter: {
          and: [
            statusActiveFilter,
            {
              property: 'Todoist Projekt',
              type: 'rich_text',
              rich_text: {
                is_empty: true,
              },
            },
            {
              timestamp: 'created_time',
              created_time: {
                after: lastSyncDate,
              },
            },
          ],
        },
      });
    }

    this.logger.log(
      `Found ${projectsSince.results.length} projects since ${lastSyncDate}`,
    );
    return projectsSince;
  }

  async findActiveLebensbereicheSince(lastSyncDate?: string) {
    let lebensbereicheSince: QueryDatabaseResponse;
    if (!lastSyncDate) {
      lebensbereicheSince = await this.findActiveLebensbereiche();
    } else {
      lebensbereicheSince = await this.notion.databases.query({
        database_id: this._lebensbereichDb,
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'ascending',
          },
        ],
        filter: {
          and: [
            statusActiveFilter,
            {
              property: 'Todoist Projekt',
              type: 'rich_text',
              rich_text: {
                is_empty: true,
              },
            },
            {
              timestamp: 'created_time',
              created_time: {
                after: lastSyncDate,
              },
            },
          ],
        },
      });
    }

    this.logger.log(
      `Found ${lebensbereicheSince.results.length} lebensbereiche since ${lastSyncDate}`,
    );
    return lebensbereicheSince;
  }

  async updateTodoistProject(notionId: string, todoistId: string) {
    await this.notion.pages.update({
      page_id: notionId,
      properties: {
        'Todoist Projekt': {
          type: 'rich_text',
          rich_text: [{ text: { content: todoistId } }],
        },
      },
    });
  }
}
