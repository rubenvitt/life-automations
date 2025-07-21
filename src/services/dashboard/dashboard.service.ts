import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService, ProjectProductivity, ProductivitySummary } from '../analytics/analytics.service';
import { NotionService } from '../notion/notion.service';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface WeeklySummaryReport {
  period: string;
  generated: string;
  summary: ProductivitySummary;
  topPerformers: ProjectProductivity[];
  needsAttention: ProjectProductivity[];
  lebensbereichInsights: {
    mostActive: string;
    leastActive: string;
    balanceScore: number;
  };
  recommendations: string[];
}

export interface MonthlyReport {
  period: string;
  generated: string;
  summary: ProductivitySummary;
  projectTrends: {
    improving: ProjectProductivity[];
    declining: ProjectProductivity[];
    stable: ProjectProductivity[];
  };
  lebensbereichAnalysis: {
    name: string;
    avgCompletionRate: number;
    projectCount: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  insights: string[];
  actionItems: string[];
}

@Injectable()
export class DashboardService {
  private readonly logger: Logger = new Logger(DashboardService.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly notionService: NotionService,
  ) {}

  async generateWeeklySummary(): Promise<WeeklySummaryReport> {
    this.logger.log('Generating weekly summary report');

    const [summary, projectAnalysis] = await Promise.all([
      this.analyticsService.getProductivitySummary(),
      this.analyticsService.getProjectProductivityAnalysis(),
    ]);

    // Top 3 performers (highest completion rate with significant activity)
    const topPerformers = projectAnalysis
      .filter(p => p.totalTasks >= 3) // Only projects with meaningful activity
      .slice(0, 3);

    // Projects that need attention (low completion rate or many overdue tasks)
    const needsAttention = projectAnalysis
      .filter(p => p.completionRate < 50 || p.overdueTasks > 2)
      .slice(0, 3);

    // Lebensbereich insights
    const lebensbereichCounts = new Map<string, number>();
    const lebensbereichActivity = new Map<string, number>();
    
    projectAnalysis.forEach(p => {
      if (p.lebensbereich) {
        lebensbereichCounts.set(p.lebensbereich, (lebensbereichCounts.get(p.lebensbereich) || 0) + 1);
        lebensbereichActivity.set(p.lebensbereich, (lebensbereichActivity.get(p.lebensbereich) || 0) + p.weeklyProgress);
      }
    });

    const mostActiveBereich = Array.from(lebensbereichActivity.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Keine Aktivität';
    
    const leastActiveBereich = Array.from(lebensbereichActivity.entries())
      .sort(([,a], [,b]) => a - b)[0]?.[0] || 'Alle aktiv';

    // Balance score (how evenly distributed is activity across Lebensbereiche)
    const totalActivity = Array.from(lebensbereichActivity.values()).reduce((sum, val) => sum + val, 0);
    const averageActivity = totalActivity / lebensbereichActivity.size;
    const variance = Array.from(lebensbereichActivity.values())
      .reduce((sum, val) => sum + Math.pow(val - averageActivity, 2), 0) / lebensbereichActivity.size;
    const balanceScore = Math.max(0, 100 - (variance / averageActivity) * 10);

    // Generate recommendations
    const recommendations = this.generateRecommendations(projectAnalysis, summary);

    return {
      period: `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'dd.MM.yyyy')} - ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'dd.MM.yyyy')}`,
      generated: format(new Date(), 'dd.MM.yyyy HH:mm'),
      summary,
      topPerformers,
      needsAttention,
      lebensbereichInsights: {
        mostActive: mostActiveBereich,
        leastActive: leastActiveBereich,
        balanceScore: Math.round(balanceScore),
      },
      recommendations,
    };
  }

  async generateMonthlyReport(): Promise<MonthlyReport> {
    this.logger.log('Generating monthly report');

    const [summary, projectAnalysis] = await Promise.all([
      this.analyticsService.getProductivitySummary(),
      this.analyticsService.getProjectProductivityAnalysis(),
    ]);

    // Categorize projects by trend
    const projectTrends = {
      improving: projectAnalysis.filter(p => p.trend === 'up'),
      declining: projectAnalysis.filter(p => p.trend === 'down'),
      stable: projectAnalysis.filter(p => p.trend === 'stable'),
    };

    // Lebensbereich analysis with trends
    const lebensbereichMap = new Map<string, {
      completionRates: number[];
      trends: ('up' | 'down' | 'stable')[];
    }>();

    projectAnalysis.forEach(p => {
      if (p.lebensbereich) {
        if (!lebensbereichMap.has(p.lebensbereich)) {
          lebensbereichMap.set(p.lebensbereich, { completionRates: [], trends: [] });
        }
        const bereich = lebensbereichMap.get(p.lebensbereich)!;
        bereich.completionRates.push(p.completionRate);
        bereich.trends.push(p.trend);
      }
    });

    const lebensbereichAnalysis = Array.from(lebensbereichMap.entries()).map(([name, data]) => {
      const avgCompletionRate = data.completionRates.reduce((sum, rate) => sum + rate, 0) / data.completionRates.length;
      const upCount = data.trends.filter(t => t === 'up').length;
      const downCount = data.trends.filter(t => t === 'down').length;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (upCount > downCount) trend = 'up';
      else if (downCount > upCount) trend = 'down';

      return {
        name,
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
        projectCount: data.completionRates.length,
        trend,
      };
    }).sort((a, b) => b.avgCompletionRate - a.avgCompletionRate);

    // Generate insights and action items
    const insights = this.generateMonthlyInsights(summary, projectTrends, lebensbereichAnalysis);
    const actionItems = this.generateActionItems(projectAnalysis, summary);

    return {
      period: `${format(startOfMonth(new Date()), 'dd.MM.yyyy')} - ${format(endOfMonth(new Date()), 'dd.MM.yyyy')}`,
      generated: format(new Date(), 'dd.MM.yyyy HH:mm'),
      summary,
      projectTrends,
      lebensbereichAnalysis,
      insights,
      actionItems,
    };
  }

  async createNotionWeeklySummaryPage(): Promise<string> {
    this.logger.log('Creating Notion weekly summary page');
    
    const report = await this.generateWeeklySummary();
    
    // Format content for Notion
    const content = this.formatWeeklySummaryForNotion(report);
    
    // This would create a page in a specific Notion database
    // For now, return formatted content
    return content;
  }

  private generateRecommendations(projects: ProjectProductivity[], summary: ProductivitySummary): string[] {
    const recommendations: string[] = [];

    if (summary.averageCompletionRate < 60) {
      recommendations.push('🎯 Fokus auf weniger Projekte - durchschnittliche Completion Rate unter 60%');
    }

    const overdueProjects = projects.filter(p => p.overdueTasks > 2);
    if (overdueProjects.length > 0) {
      recommendations.push(`⚡ ${overdueProjects.length} Projekte haben viele überfällige Tasks - Priorisierung überdenken`);
    }

    const inactiveProjects = projects.filter(p => p.weeklyProgress === 0);
    if (inactiveProjects.length > projects.length * 0.3) {
      recommendations.push('📈 Über 30% der Projekte ohne wöchentlichen Fortschritt - Review durchführen');
    }

    if (summary.topLebensbereiche.length > 0) {
      const topBereich = summary.topLebensbereiche[0];
      if (topBereich.completionRate > 80) {
        recommendations.push(`✨ ${topBereich.name} läuft super (${Math.round(topBereich.completionRate)}%) - als Vorbild für andere nutzen`);
      }
    }

    return recommendations;
  }

  private generateMonthlyInsights(
    summary: ProductivitySummary,
    trends: { improving: ProjectProductivity[]; declining: ProjectProductivity[]; stable: ProjectProductivity[] },
    lebensbereichAnalysis: any[]
  ): string[] {
    const insights: string[] = [];

    // Overall trend insight
    if (summary.overallTrend === 'up') {
      insights.push('📈 Positiver Gesamttrend - mehr Projekte verbessern sich als verschlechtern');
    } else if (summary.overallTrend === 'down') {
      insights.push('📉 Negativer Trend erkennbar - mehr Aufmerksamkeit für stagnierende Projekte nötig');
    }

    // Project distribution insight
    const improvingRatio = trends.improving.length / summary.totalProjects;
    if (improvingRatio > 0.4) {
      insights.push(`🚀 ${Math.round(improvingRatio * 100)}% der Projekte zeigen Verbesserung`);
    }

    // Lebensbereich insights
    if (lebensbereichAnalysis.length > 0) {
      const bestBereich = lebensbereichAnalysis[0];
      const worstBereich = lebensbereichAnalysis[lebensbereichAnalysis.length - 1];
      
      if (bestBereich.avgCompletionRate - worstBereich.avgCompletionRate > 30) {
        insights.push(`⚖️ Ungleichgewicht: ${bestBereich.name} (${Math.round(bestBereich.avgCompletionRate)}%) vs ${worstBereich.name} (${Math.round(worstBereich.avgCompletionRate)}%)`);
      }
    }

    return insights;
  }

  private generateActionItems(projects: ProjectProductivity[], summary: ProductivitySummary): string[] {
    const actions: string[] = [];

    // Projects needing immediate attention
    const criticalProjects = projects.filter(p => p.completionRate < 30 && p.totalTasks > 5);
    if (criticalProjects.length > 0) {
      actions.push(`🆘 ${criticalProjects.length} kritische Projekte (<30% Completion) prüfen und ggf. pausieren`);
    }

    // High overdue count
    const overdueProjects = projects.filter(p => p.overdueTasks > 5);
    if (overdueProjects.length > 0) {
      actions.push(`📅 ${overdueProjects.length} Projekte mit >5 überfälligen Tasks - Deadlines realistisch anpassen`);
    }

    // Inactive projects
    const inactiveProjects = projects.filter(p => p.monthlyProgress === 0 && p.totalTasks > 0);
    if (inactiveProjects.length > 0) {
      actions.push(`💤 ${inactiveProjects.length} inaktive Projekte - Status überprüfen (pausieren/archivieren?)`);
    }

    // Balance improvement
    if (summary.topLebensbereiche.length > 1) {
      const gap = summary.topLebensbereiche[0].completionRate - summary.topLebensbereiche[summary.topLebensbereiche.length - 1].completionRate;
      if (gap > 40) {
        actions.push('⚖️ Work-Life-Balance verbessern - unterrepräsentierte Lebensbereiche stärken');
      }
    }

    return actions;
  }

  private formatWeeklySummaryForNotion(report: WeeklySummaryReport): string {
    return `# 📊 Wochenzusammenfassung ${report.period}

## 🎯 Überblick
- **Projekte gesamt:** ${report.summary.totalProjects}
- **Durchschnittliche Completion Rate:** ${report.summary.averageCompletionRate}%
- **Trend:** ${report.summary.overallTrend === 'up' ? '📈 Aufwärts' : report.summary.overallTrend === 'down' ? '📉 Abwärts' : '➡️ Stabil'}

## 🏆 Top Performer
${report.topPerformers.map(p => `- **${p.notionProjectName}**: ${p.completionRate}% (${p.completedTasks}/${p.totalTasks} Tasks)`).join('\n')}

## ⚠️ Benötigt Aufmerksamkeit
${report.needsAttention.map(p => `- **${p.notionProjectName}**: ${p.completionRate}% (${p.overdueTasks} überfällig)`).join('\n')}

## 🎨 Lebensbereich-Insights
- **Aktivster Bereich:** ${report.lebensbereichInsights.mostActive}
- **Balance-Score:** ${report.lebensbereichInsights.balanceScore}/100

## 💡 Empfehlungen
${report.recommendations.map(r => `- ${r}`).join('\n')}

---
*Automatisch generiert am ${report.generated}*`;
  }
}