import { Injectable, Logger } from '@nestjs/common';
import { NotionService } from '../services/notion/notion.service';
import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

@Injectable()
export class ClientApiService {
  private readonly logger: Logger = new Logger(ClientApiService.name);

  constructor(private readonly notionService: NotionService) {}

  async findMomentTypes() {
    return await this.notionService.momentTypes();
  }

  async setDailyGoals(goals: string[]) {
    const dailyReview = await this.expectCurrentDailyReview();

    await this.notionService.setDailyGoals(dailyReview, goals);
  }

  async findDailyGoals() {
    const dailyReview = await this.expectCurrentDailyReview();

    const goals = await this.notionService.findDailyGoalsForReview(dailyReview);

    return goals;

    /*return (
      dailyReview.properties['Tägliche Ziele']['rich_text'][0][
        'plain_text'
      ].split('\n') as string[]
    ).map((goal) => goal.replace('- ', ''));*/
  }

  async createMoment(moment: {
    name: string;
    momentTypeId?: string;
    momentType?: string;
  }) {
    if (moment.momentTypeId || !moment.momentType) {
      return this.notionService.createMoment(moment);
    }

    const momentTypes = await this.findMomentTypes();
    const momentTypeId = momentTypes.find(
      (type) => type.name === moment.momentType,
    );

    if (!momentTypeId) {
      throw new Error(`Moment type ${moment.momentType} not found`);
    }

    return this.notionService.createMoment({
      name: moment.name,
      momentTypeId: momentTypeId.id,
    });
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
        time: moment['properties']['Zeitpunkt'].date.start,
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
