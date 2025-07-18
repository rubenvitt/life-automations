import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@notionhq/client';
import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import {
  endOfDay,
  format,
  formatISO,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import { PerplexityAiService } from '../perplexity-ai/perplexity-ai.service';
import { NotionAuthService } from './notion-auth/notion-auth.service';
import {
  createNotionPropertiesForDailyReview,
  createNotionPropertiesForLongtermReview,
  createNotionPropertiesForMonthlyReview,
  createNotionPropertiesForWeeklyReview,
  createNotionPropertiesForYearlyReview,
  floor5Years,
  genericIcon,
  isoDateOf,
  seasonalIcon,
} from './notion.utils';
import { ProjectsService } from './projects/projects.service';

@Injectable()
export class NotionService {
  private readonly logger: Logger = new Logger(NotionService.name);
  private notion: Client;
  private dailyReviewsDb: string;
  private weeklyReviewsDb;
  private monthlyReviewsDb;
  private yearlyReviewsDb;
  private longtermReviewsDb;
  private contractsDb;
  private momentsDb;

  constructor(
    notionAuthService: NotionAuthService,
    configService: ConfigService,
    private readonly perplexityAiService: PerplexityAiService,
    private readonly _projectService: ProjectsService,
  ) {
    this.notion = notionAuthService.notion();

    this.dailyReviewsDb = configService.getOrThrow('NOTION_DAILY_REVIEWS_DB');
    this.weeklyReviewsDb = configService.getOrThrow('NOTION_WEEKLY_REVIEWS_DB');
    this.monthlyReviewsDb = configService.getOrThrow(
      'NOTION_MONTHLY_REVIEWS_DB',
    );
    this.yearlyReviewsDb = configService.getOrThrow('NOTION_YEARLY_REVIEWS_DB');
    this.longtermReviewsDb = configService.getOrThrow(
      'NOTION_LONGTERM_REVIEWS_DB',
    );
    this.momentsDb = configService.getOrThrow('NOTION_MOMENTS_DB');
    this.contractsDb = configService.getOrThrow('NOTION_CONTRACTS_DB');
  }

  findCurrentDailyReview() {
    return this.notion.databases.query({
      database_id: this.dailyReviewsDb,
      filter: {
        property: 'Datum',
        date: {
          equals: isoDateOf(),
        },
      },
    });
  }

  async generateSpecialText() {
    return this.perplexityAiService
      .sendPrompt(
        `Was ist am ${format(new Date(), 'dd.MM.')} besonders? (antworte kurz)`,
        'sonar-reasoning',
        {
          // will be ignored by pplx-online :(
          content:
            'Antworte so kurz wie möglich. Nicht mehr.\n' +
            'Sei ganz präzise, entschuldige Dich nicht und rede dich nicht raus. Erwähne niemals die Suchergebnisse.\n' +
            'Beantworte genau die Frage, die Dir vom user gestellt wird. Lokale Veranstaltungen spielen keine Rolle.\n' +
            'Es geht nur um allgemeine Fakten genau zu der Frage. Erwähne niemals die Suchergebnisse.\n' +
            'Antworte ausschließlich mit einer Liste, keine Einleitung oder Zusammenfassung.\n' +
            'Du darfst Emojis benutzen, aber kein Markdown. Benutze unter keinen Umständen Markdown. Antworte als Liste:\n1. [text]\n2.[text]',
          role: 'system',
        },
      )
      .then((response) =>
        response.replace(/<think>[\s\S]*?<\/think>\s*\n*/, '').trim(),
      );
  }

  async createDailyReview() {
    const currentWeeklyReviewId = (await this.findCurrentWeeklyReview())
      .results[0].id;
    this.logger.log('Current weekly review', currentWeeklyReviewId);

    return await this.notion.pages.create({
      parent: {
        database_id: this.dailyReviewsDb,
      },
      icon: seasonalIcon(),
      // @ts-ignore
      properties: createNotionPropertiesForDailyReview(
        currentWeeklyReviewId,
        await this.generateSpecialText().then((value) => value.trim()),
      ),
    });
  }

  findCurrentWeeklyReview() {
    return this.notion.databases.query({
      database_id: this.weeklyReviewsDb,
      filter: {
        property: 'Bereich der Woche',
        date: {
          equals: isoDateOf(startOfISOWeek(new Date())),
        },
      },
    });
  }

  async createWeeklyReview() {
    const currentMonthlyReviewId = (await this.findCurrentMonthlyReview())
      .results[0].id;
    this.logger.log('Current monthly review', currentMonthlyReviewId);

    return await this.notion.pages.create({
      parent: {
        database_id: this.weeklyReviewsDb,
      },
      icon: seasonalIcon(),
      // @ts-expect-error properties are ok
      properties: createNotionPropertiesForWeeklyReview(currentMonthlyReviewId),
    });
  }

  findCurrentMonthlyReview() {
    return this.notion.databases.query({
      database_id: this.monthlyReviewsDb,
      filter: {
        property: 'Bereich des Monats',
        date: {
          equals: isoDateOf(startOfMonth(new Date())),
        },
      },
    });
  }

  async createMonthlyReview() {
    const currentYearlyReviewId = (await this.findCurrentYearlyReview())
      .results[0].id;
    this.logger.log('Current yearly review', currentYearlyReviewId);
    return await this.notion.pages.create({
      parent: {
        database_id: this.monthlyReviewsDb,
      },
      icon: seasonalIcon(),
      // @ts-ignore
      properties: createNotionPropertiesForMonthlyReview(currentYearlyReviewId),
    });
  }

  findCurrentYearlyReview() {
    return this.notion.databases.query({
      database_id: this.yearlyReviewsDb,
      filter: {
        property: 'Bereich des Jahres',
        date: {
          equals: isoDateOf(startOfYear(new Date())),
        },
      },
    });
  }

  async createYearlyReview() {
    const currentYearlyReviewId = (await this.findCurrentLangfristigesReview())
      .results[0].id;
    this.logger.log(
      'Current longterm review',
      this.findCurrentLangfristigesReview(),
    );
    return await this.notion.pages.create({
      parent: {
        database_id: this.yearlyReviewsDb,
      },
      icon: genericIcon(),
      // @ts-ignore
      properties: createNotionPropertiesForYearlyReview(currentYearlyReviewId),
    });
  }

  findCurrentLangfristigesReview() {
    return this.notion.databases.query({
      database_id: this.longtermReviewsDb,
      filter: {
        property: 'Bereich des Reviews',
        date: {
          equals: isoDateOf(startOfYear(floor5Years())),
        },
      },
    });
  }

  async createLongtermReview() {
    return await this.notion.pages.create({
      parent: {
        database_id: this.longtermReviewsDb,
      },
      icon: genericIcon(),
      // @ts-ignore
      properties: createNotionPropertiesForLongtermReview(),
    });
  }

  async findDailyGoalsForReview(dailyReview: DatabaseObjectResponse) {
    this.logger.log('Finding daily goals for review', dailyReview.id);

    throw new NotImplementedException('Not working yet');
  }

  findContracts(onlyFresh: boolean) {
    return this.notion.databases.query({
      database_id: this.contractsDb,
      filter: {
        and: [
          {
            property: 'Budgetrelevant',
            checkbox: {
              equals: true,
            },
          },
          {
            property: 'Status',
            status: {
              equals: 'Laufend',
            },
          },
          onlyFresh
            ? {
                property: 'Firefly id',
                rich_text: {
                  is_empty: true,
                },
              }
            : undefined,
        ],
      },
    });
  }

  async findAllNotionDatabases(): Promise<DatabaseObjectResponse[]> {
    const result: DatabaseObjectResponse[] = [];
    let searchResponse = await this.notion.search({
      filter: {
        value: 'database',
        property: 'object',
      },
      page_size: 100,
    });
    result.push(...(searchResponse.results as DatabaseObjectResponse[]));
    while (searchResponse.has_more) {
      searchResponse = await this.notion.search({
        filter: {
          value: 'database',
          property: 'object',
        },
        start_cursor: searchResponse.next_cursor,
      });
      result.push(...(searchResponse.results as DatabaseObjectResponse[]));
    }

    return result;
  }

  async updateWeeklyReviewWithAdditionalMonthlyReview(
    currentWeek: DatabaseObjectResponse,
    month: string,
  ) {
    this.notion.pages.update({
      page_id: currentWeek.id,
      properties: {
        'Monatliches Review': {
          // @ts-ignore
          relation: [
            ...currentWeek.properties['Monatliches Review']['relation'],
            { id: month },
          ],
        },
      },
    });
  }

  async momentTypes(): Promise<
    {
      id: string;
      name: string;
      color: string;
      description?: string;
    }[]
  > {
    return this.notion.databases
      .retrieve({
        database_id: this.momentsDb,
      })
      .then((db) => {
        return db.properties['Typ']['select']['options'];
      });
  }

  createMoment(moment: { name: string; momentTypeId?: string }) {
    return this.notion.pages.create({
      parent: {
        database_id: this.momentsDb,
      },
      properties: {
        ...(moment.momentTypeId
          ? {
              Typ: {
                select: {
                  id: moment.momentTypeId,
                },
              },
            }
          : {}),
        Zeitpunkt: {
          date: {
            start: formatISO(new Date()),
          },
        },
        Name: {
          title: [
            {
              text: {
                content: moment.name,
              },
              type: 'text',
            },
          ],
        },
      },
    });
  }

  setDailyGoals(dailyReview: DatabaseObjectResponse, goals: string[]) {
    return this.notion.pages.update({
      page_id: dailyReview.id,
      properties: {
        // ['Tagesziel / Fokus']['rich_text'][0]['plain_text']
        'Tagesziel / Fokus': {
          rich_text: [
            {
              text: {
                content: goals
                  .map((goal) => {
                    return `- ${goal}`;
                  })
                  .join('\n'),
              },
            },
          ],
        },
      },
    });
  }

  updateBillId(notionId: string, fireflyId: string) {
    this.logger.log(
      `Updating Notion BillId ${notionId} with FireflyId ${fireflyId}`,
    );
    return this.notion.pages.update({
      page_id: notionId,
      properties: {
        'Firefly id': {
          rich_text: [
            {
              text: {
                content: fireflyId,
              },
            },
          ],
        },
      },
    });
  }

  projectService() {
    return this._projectService;
  }

  findMoments() {
    this.logger.log(
      'Finding moments for today (' +
        startOfDay(new Date()).toISOString() +
        ') and before (' +
        endOfDay(new Date()).toISOString() +
        ')',
    );
    return this.notion.databases.query({
      database_id: this.momentsDb,
      filter: {
        and: [
          {
            property: 'Zeitpunkt',
            date: {
              on_or_after: startOfDay(new Date()).toISOString(),
            },
          },
          {
            property: 'Zeitpunkt',
            date: {
              on_or_before: endOfDay(new Date()).toISOString(),
            },
          },
        ],
      },
    });
  }
}
