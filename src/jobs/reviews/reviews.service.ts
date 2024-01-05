import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotionService } from '../../services/notion/notion.service';
import { isoDateOf } from '../../services/notion/notion.utils';
import {
  CreatePageResponse,
  DatabaseObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

@Injectable()
export class ReviewsService {
  private readonly logger: Logger = new Logger(ReviewsService.name);

  constructor(private notionService: NotionService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async handleCron() {
    this.logger.log('Reviews Cronjob wird ausgeführt! ⏰');
    if (await this.isDailyReviewPresent()) {
      // do nothing
      return;
    }
    await this.createCurrentLongtermIfNecessary();
    await this.createCurrentYearIfNecessary();
    const month = await this.createCurrentMonthIfNecessary();
    if (month) {
      const currentWeek = await this.findCurrentWeek();
      if (currentWeek) {
        await this.updateCurrentWeek(currentWeek, month);
      }
    }
    await this.createCurrentWeekIfNecessary();
    await this.createCurrentDayIfNecessary();

    await this.addProjectsToCurrentReviews();
  }

  @Cron('55 * * * *') // every day at *:55
  async handleProjectReviewConnection() {
    await this.addProjectsToCurrentReviews();
  }

  private async isDailyReviewPresent() {
    const {
      results: [dailyReview = null],
    } = await this.notionService.findCurrentDailyReview();
    if (dailyReview) {
      this.logger.verbose(`Daily review for ${isoDateOf()} is already present`);
      return true;
    }

    return false;
  }

  private async createCurrentDayIfNecessary() {
    if (await this.isDailyReviewPresent()) {
      this.logger.verbose(`Daily review for ${isoDateOf()} is already present`);
      return null;
    }
    this.logger.verbose('Creating current daily review for ' + isoDateOf());
    await this.notionService.createDailyReview();
  }

  private async createCurrentWeekIfNecessary() {
    if (await this.findCurrentWeek()) {
      this.logger.verbose(
        `Weekly review for ${isoDateOf()} is already present`,
      );
      return null;
    }
    this.logger.verbose('Creating current weekly review for ' + isoDateOf());
    await this.notionService.createWeeklyReview();
  }

  private async createCurrentMonthIfNecessary() {
    if (await this.findCurrentMonth()) {
      this.logger.verbose(
        `Monthly review for ${isoDateOf()} is already present`,
      );
      return null;
    }
    this.logger.verbose('Creating current monthly review for ' + isoDateOf());
    return await this.notionService.createMonthlyReview();
  }

  private async createCurrentYearIfNecessary() {
    if (await this.findCurrentYear()) {
      this.logger.verbose(
        `Yearly review for ${isoDateOf()} is already present`,
      );
      return null;
    }
    this.logger.verbose('Creating current yearly review for ' + isoDateOf());
    await this.notionService.createYearlyReview();
  }

  private async createCurrentLongtermIfNecessary() {
    if (await this.findCurrentLongterm()) {
      this.logger.verbose(
        `Longterm review for ${isoDateOf()} is already present`,
      );
      return null;
    }
    this.logger.verbose('Creating current longterm review for ' + isoDateOf());
    await this.notionService.createLongtermReview();
  }

  private async findCurrentWeek() {
    const {
      results: [weeklyReview = null],
    } = await this.notionService.findCurrentWeeklyReview();
    if (weeklyReview) {
      this.logger.verbose('Weekly review for ' + isoDateOf() + ' found');
      return weeklyReview as DatabaseObjectResponse;
    }

    return null;
  }

  private async findCurrentMonth() {
    const {
      results: [monthlyReview = null],
    } = await this.notionService.findCurrentMonthlyReview();
    if (monthlyReview) {
      this.logger.verbose('Monthly review for ' + isoDateOf() + ' found');
      return monthlyReview;
    }

    return null;
  }

  private async findCurrentYear() {
    const {
      results: [yearlyReview = null],
    } = await this.notionService.findCurrentYearlyReview();
    if (yearlyReview) {
      this.logger.verbose('Yearly review for ' + isoDateOf() + ' found');
      return yearlyReview;
    }

    return null;
  }

  private async findCurrentLongterm() {
    const {
      results: [longtermReview = null],
    } = await this.notionService.findCurrentLangfristigesReview();
    if (longtermReview) {
      this.logger.verbose('Longterm review for ' + isoDateOf() + ' found');
      return longtermReview;
    }

    return null;
  }

  private async updateCurrentWeek(
    currentWeek: DatabaseObjectResponse,
    month: CreatePageResponse,
  ) {
    await this.notionService.updateWeeklyReviewWithAdditionalMonthlyReview(
      currentWeek,
      month.id,
    );
  }

  private async addProjectsToCurrentReviews() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const weeklyReview = await this.notionService.findCurrentWeeklyReview();

    await this.notionService
      .projectService()
      .addProjectsToWeeklyReview(weeklyReview.results[0].id);
  }
}
