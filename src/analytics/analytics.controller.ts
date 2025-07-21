import { Controller, Get, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AnalyticsService, ProjectProductivity, ProductivitySummary } from '../services/analytics/analytics.service';
import { DashboardService, WeeklySummaryReport, MonthlyReport } from '../services/dashboard/dashboard.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('projects/productivity')
  async getProjectProductivity(): Promise<ProjectProductivity[]> {
    try {
      return await this.analyticsService.getProjectProductivityAnalysis();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch project productivity: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('summary')
  async getProductivitySummary(): Promise<ProductivitySummary> {
    try {
      return await this.analyticsService.getProductivitySummary();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch productivity summary: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard/weekly')
  async getWeeklySummary(): Promise<WeeklySummaryReport> {
    try {
      return await this.dashboardService.generateWeeklySummary();
    } catch (error) {
      throw new HttpException(
        `Failed to generate weekly summary: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard/monthly')
  async getMonthlyReport(): Promise<MonthlyReport> {
    try {
      return await this.dashboardService.generateMonthlyReport();
    } catch (error) {
      throw new HttpException(
        `Failed to generate monthly report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard/weekly/notion')
  async createWeeklySummaryInNotion(): Promise<{ content: string; message: string }> {
    try {
      const content = await this.dashboardService.createNotionWeeklySummaryPage();
      return {
        content,
        message: 'Weekly summary content generated successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create weekly summary in Notion: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('projects/top-performers')
  async getTopPerformingProjects(@Query('limit') limit = '5'): Promise<ProjectProductivity[]> {
    try {
      const allProjects = await this.analyticsService.getProjectProductivityAnalysis();
      const limitNum = parseInt(limit, 10);
      
      return allProjects
        .filter(p => p.totalTasks >= 3) // Only meaningful projects
        .slice(0, limitNum);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch top performing projects: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('projects/needs-attention')
  async getProjectsNeedingAttention(): Promise<ProjectProductivity[]> {
    try {
      const allProjects = await this.analyticsService.getProjectProductivityAnalysis();
      
      return allProjects
        .filter(p => p.completionRate < 50 || p.overdueTasks > 2)
        .sort((a, b) => {
          // Sort by urgency: more overdue tasks first, then by lower completion rate
          if (a.overdueTasks !== b.overdueTasks) {
            return b.overdueTasks - a.overdueTasks;
          }
          return a.completionRate - b.completionRate;
        });
    } catch (error) {
      throw new HttpException(
        `Failed to fetch projects needing attention: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('lebensbereiche/overview')
  async getLebensbereicheOverview(): Promise<{
    name: string;
    projectCount: number;
    avgCompletionRate: number;
    totalTasks: number;
    completedTasks: number;
    trend: 'up' | 'down' | 'stable';
  }[]> {
    try {
      const projects = await this.analyticsService.getProjectProductivityAnalysis();
      
      // Group by Lebensbereich
      const lebensbereichMap = new Map<string, {
        projects: ProjectProductivity[];
        totalTasks: number;
        completedTasks: number;
      }>();

      projects.forEach(p => {
        if (p.lebensbereich) {
          if (!lebensbereichMap.has(p.lebensbereich)) {
            lebensbereichMap.set(p.lebensbereich, {
              projects: [],
              totalTasks: 0,
              completedTasks: 0,
            });
          }
          const bereich = lebensbereichMap.get(p.lebensbereich)!;
          bereich.projects.push(p);
          bereich.totalTasks += p.totalTasks;
          bereich.completedTasks += p.completedTasks;
        }
      });

      return Array.from(lebensbereichMap.entries()).map(([name, data]) => {
        const avgCompletionRate = data.projects.reduce((sum, p) => sum + p.completionRate, 0) / data.projects.length;
        
        // Calculate trend based on project trends
        const upCount = data.projects.filter(p => p.trend === 'up').length;
        const downCount = data.projects.filter(p => p.trend === 'down').length;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (upCount > downCount) trend = 'up';
        else if (downCount > upCount) trend = 'down';

        return {
          name,
          projectCount: data.projects.length,
          avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
          totalTasks: data.totalTasks,
          completedTasks: data.completedTasks,
          trend,
        };
      }).sort((a, b) => b.avgCompletionRate - a.avgCompletionRate);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch Lebensbereiche overview: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}