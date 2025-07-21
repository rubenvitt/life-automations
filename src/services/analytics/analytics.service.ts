import { Injectable, Logger } from '@nestjs/common';
import { NotionService } from '../notion/notion.service';
import { TodoistService } from '../todoist/todoist.service';
import { format, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface ProjectProductivity {
  notionProjectId: string;
  notionProjectName: string;
  todoistProjectId?: string;
  lebensbereich?: string;
  completionRate: number;
  activeTasks: number;
  completedTasks: number;
  totalTasks: number;
  overdueTasks: number;
  weeklyProgress: number;
  monthlyProgress: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ProductivitySummary {
  totalProjects: number;
  averageCompletionRate: number;
  mostProductiveProject: ProjectProductivity;
  leastProductiveProject: ProjectProductivity;
  topLebensbereiche: { name: string; completionRate: number; projectCount: number }[];
  overallTrend: 'up' | 'down' | 'stable';
}

@Injectable()
export class AnalyticsService {
  private readonly logger: Logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly notionService: NotionService,
    private readonly todoistService: TodoistService,
  ) {}

  async getProjectProductivityAnalysis(): Promise<ProjectProductivity[]> {
    this.logger.log('Starting project productivity analysis');

    // Get active projects from Notion
    const activeProjects = await this.notionService.projectService().findActiveProjects();
    const activeLebensbereiche = await this.notionService.projectService().findActiveLebensbereiche();
    
    const lebensbereichMap = new Map();
    activeLebensbereiche.results.forEach(lb => {
      if ('properties' in lb) {
        const properties = lb.properties as any;
        lebensbereichMap.set(lb.id, properties?.Name?.title?.[0]?.plain_text || 'Unknown');
      }
    });

    const productivity: ProjectProductivity[] = [];

    for (const project of activeProjects.results) {
      if (!('properties' in project)) continue;
      const properties = project.properties as any;
      const projectName = properties?.Name?.title?.[0]?.plain_text || 'Unknown Project';
      const todoistProjectId = properties?.['Todoist Projekt']?.rich_text?.[0]?.plain_text;
      const lebensbereichId = properties?.Lebensbereich?.relation?.[0]?.id;
      const lebensbereich = lebensbereichId ? lebensbereichMap.get(lebensbereichId) : undefined;

      let stats = {
        projectId: '',
        activeTasks: 0,
        completedTasks: 0,
        totalTasks: 0,
        completionRate: 0,
        overdueTasks: 0
      };

      let weeklyProgress = 0;
      let monthlyProgress = 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';

      if (todoistProjectId) {
        try {
          // Get current stats
          stats = await this.todoistService.getProjectStats(todoistProjectId);
          
          // Get weekly and monthly progress
          const [weeklyStats, monthlyStats] = await Promise.all([
            this.todoistService.getWeeklyStats(todoistProjectId),
            this.todoistService.getMonthlyStats(todoistProjectId)
          ]);
          
          weeklyProgress = weeklyStats.completedTasks;
          monthlyProgress = monthlyStats.completedTasks;

          // Calculate trend (simplified: compare this month to last month)
          const lastMonthStats = await this.todoistService.getCompletedTasks(
            todoistProjectId,
            format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
            format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
          );
          
          const lastMonthCount = lastMonthStats.results.length;
          if (monthlyProgress > lastMonthCount * 1.1) trend = 'up';
          else if (monthlyProgress < lastMonthCount * 0.9) trend = 'down';
          
        } catch (error) {
          this.logger.warn(`Failed to get Todoist stats for project ${todoistProjectId}:`, error.message);
        }
      }

      productivity.push({
        notionProjectId: project.id,
        notionProjectName: projectName,
        todoistProjectId,
        lebensbereich,
        completionRate: stats.completionRate,
        activeTasks: stats.activeTasks,
        completedTasks: stats.completedTasks,
        totalTasks: stats.totalTasks,
        overdueTasks: stats.overdueTasks,
        weeklyProgress,
        monthlyProgress,
        trend
      });
    }

    this.logger.log(`Analyzed ${productivity.length} projects`);
    return productivity.sort((a, b) => b.completionRate - a.completionRate);
  }

  async getProductivitySummary(): Promise<ProductivitySummary> {
    const projectAnalysis = await this.getProjectProductivityAnalysis();
    
    if (projectAnalysis.length === 0) {
      return {
        totalProjects: 0,
        averageCompletionRate: 0,
        mostProductiveProject: null,
        leastProductiveProject: null,
        topLebensbereiche: [],
        overallTrend: 'stable'
      };
    }

    const averageCompletionRate = projectAnalysis.reduce((sum, p) => sum + p.completionRate, 0) / projectAnalysis.length;
    
    // Group by Lebensbereich
    const lebensbereichStats = new Map<string, { totalCompletion: number; count: number }>();
    projectAnalysis.forEach(p => {
      if (p.lebensbereich) {
        const current = lebensbereichStats.get(p.lebensbereich) || { totalCompletion: 0, count: 0 };
        current.totalCompletion += p.completionRate;
        current.count += 1;
        lebensbereichStats.set(p.lebensbereich, current);
      }
    });

    const topLebensbereiche = Array.from(lebensbereichStats.entries())
      .map(([name, stats]) => ({
        name,
        completionRate: stats.totalCompletion / stats.count,
        projectCount: stats.count
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    // Calculate overall trend
    const upTrends = projectAnalysis.filter(p => p.trend === 'up').length;
    const downTrends = projectAnalysis.filter(p => p.trend === 'down').length;
    let overallTrend: 'up' | 'down' | 'stable' = 'stable';
    if (upTrends > downTrends * 1.5) overallTrend = 'up';
    else if (downTrends > upTrends * 1.5) overallTrend = 'down';

    return {
      totalProjects: projectAnalysis.length,
      averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
      mostProductiveProject: projectAnalysis[0],
      leastProductiveProject: projectAnalysis[projectAnalysis.length - 1],
      topLebensbereiche,
      overallTrend
    };
  }
}