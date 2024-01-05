import { Injectable, Logger } from '@nestjs/common';
import { FireflyService } from '../../firefly/firefly.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MoneyService {
  private readonly logger: Logger = new Logger(MoneyService.name);
  constructor(private readonly fireflyService: FireflyService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    this.logger.log('Money Cronjob wird ausgeführt! ⏰');

    await this.fireflyService.syncBills();
  }
}
