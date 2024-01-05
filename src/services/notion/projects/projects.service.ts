import { Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { NotionAuthService } from '../notion-auth/notion-auth.service';
import { SettingsService } from '../../../settings/settings.service';

@Injectable()
export class ProjectsService {
  private readonly notion: Client;
  private _projectsDb: string;
  constructor(
    notionAuthService: NotionAuthService,
    settingsService: SettingsService,
  ) {
    this.notion = notionAuthService.notion();

    settingsService.findOrWarn('notion', 'projects').then((databaseId) => {
      this._projectsDb = databaseId;
    });
  }

  async findActiveProjects() {
    return await this.notion.databases.query({
      database_id: this._projectsDb,
      filter: {
        property: 'Status',
        status: {
          equals: 'In Bearbeitung',
        },
      },
    });
  }

  async addProjectsToWeeklyReview(weeklyReview: string) {
    const activeProjects = await this.findActiveProjects();

    await this.notion.pages.update({
      page_id: weeklyReview,
      properties: {
        Projekte: {
          relation: activeProjects.results.map((project) => ({
            id: project.id,
          })),
        },
      },
    });
  }
}
