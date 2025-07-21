import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from '../services/analytics/analytics.service';
import { DashboardService } from '../services/dashboard/dashboard.service';
import { NotionModule } from '../services/notion/notion.module';
import { TodoistModule } from '../services/todoist/todoist.module';

@Module({
  imports: [NotionModule, TodoistModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DashboardService],
  exports: [AnalyticsService, DashboardService],
})
export class AnalyticsModule {}