import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews/reviews.service';
import { NotionModule } from '../services/notion/notion.module';
import { MoneyService } from './money/money.service';
import { FireflyModule } from '../firefly/firefly.module';

@Module({
  imports: [NotionModule, FireflyModule],
  providers: [ReviewsService, MoneyService],
})
export class JobsModule {}
