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

    return (
      dailyReview.properties['Tagesziel / Fokus']['rich_text'][0][
        'plain_text'
      ].split('\n') as string[]
    ).map((goal) => goal.replace('- ', ''));
  }

  createMoment(moment: { name: string; momentTypeId: string }) {
    return this.notionService.createMoment(moment);
  }

  private async expectCurrentDailyReview() {
    return (await this.notionService
      .findCurrentDailyReview()
      .then((value) => value.results.at(0))) as DatabaseObjectResponse;
  }
}
