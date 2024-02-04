import { Injectable, Logger } from '@nestjs/common';
import { NotionService } from '../services/notion/notion.service';
import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

@Injectable()
export class ClientApiService {
  private readonly logger: Logger = new Logger(ClientApiService.name);

  constructor(private readonly notionService: NotionService) {}

  async findMomentTypes() {
    const momentTypes = await this.notionService.momentTypes();
    this.logger.log('found moment types', momentTypes);
    return momentTypes;
  }

  async setDailyGoals(goals: string[]) {
    const dailyReview = await this.expectCurrentDailyReview();

    await this.notionService.setDailyGoals(dailyReview, goals);
  }

  async findDailyGoals() {
    const dailyReview = await this.expectCurrentDailyReview();

    //await this.notionService.findDailyGoalsForReview(dailyReview);

    return [];

    /*return (
      dailyReview.properties['Tägliche Ziele']['rich_text'][0][
        'plain_text'
      ].split('\n') as string[]
    ).map((goal) => goal.replace('- ', ''));*/
  }

  createMoment(moment: { name: string; momentTypeId?: string }) {
    return this.notionService.createMoment(moment);
  }

  async findMoments() {
    const momentTypes = await this.findMomentTypes();

    const moments = await this.notionService.findMoments().then((value) => {
      return value;
    });

    return moments.results.map((moment) => {
      return {
        id: moment.id,
        name: moment['properties']['Name'].title[0].plain_text,
        momentType: moment['properties']['Typ'].select
          ? momentTypes.find(
              (type) => type.id === moment['properties']['Typ'].select.id,
            )?.name
          : undefined,
      };
    });
  }

  private async expectCurrentDailyReview() {
    return (await this.notionService
      .findCurrentDailyReview()
      .then((value) => value.results.at(0))) as DatabaseObjectResponse;
  }
}
