import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from '../services/analytics/analytics.service';
import { DashboardService } from '../services/dashboard/dashboard.service';
import { HttpException } from '@nestjs/common';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let dashboardService: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const mockAnalyticsService = {
      getProjectProductivityAnalysis: jest.fn(),
      getProductivitySummary: jest.fn(),
    };

    const mockDashboardService = {
      generateWeeklySummary: jest.fn(),
      generateMonthlyReport: jest.fn(),
      createNotionWeeklySummaryPage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get(AnalyticsService);
    dashboardService = module.get(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjectProductivity', () => {
    it('should return project productivity data', async () => {
      const mockData = [
        {
          notionProjectId: '1',
          notionProjectName: 'Test Project',
          completionRate: 75,
          activeTasks: 5,
          completedTasks: 15,
          totalTasks: 20,
          overdueTasks: 2,
          weeklyProgress: 3,
          monthlyProgress: 12,
          trend: 'up' as const,
        },
      ];

      analyticsService.getProjectProductivityAnalysis.mockResolvedValue(mockData);

      const result = await controller.getProjectProductivity();

      expect(result).toEqual(mockData);
      expect(analyticsService.getProjectProductivityAnalysis).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      analyticsService.getProjectProductivityAnalysis.mockRejectedValue(new Error('API Error'));

      await expect(controller.getProjectProductivity()).rejects.toThrow(HttpException);
    });
  });

  describe('getTopPerformingProjects', () => {
    it('should return filtered top performers', async () => {
      const mockData = [
        {
          notionProjectId: '1',
          notionProjectName: 'High Performer',
          completionRate: 85,
          totalTasks: 10, // >= 3, should be included
          activeTasks: 2,
          completedTasks: 8,
          overdueTasks: 0,
          weeklyProgress: 2,
          monthlyProgress: 8,
          trend: 'up' as const,
        },
        {
          notionProjectId: '2',
          notionProjectName: 'Low Activity',
          completionRate: 90,
          totalTasks: 2, // < 3, should be filtered out
          activeTasks: 0,
          completedTasks: 2,
          overdueTasks: 0,
          weeklyProgress: 0,
          monthlyProgress: 2,
          trend: 'stable' as const,
        },
      ];

      analyticsService.getProjectProductivityAnalysis.mockResolvedValue(mockData);

      const result = await controller.getTopPerformingProjects('5');

      expect(result).toHaveLength(1);
      expect(result[0].notionProjectName).toBe('High Performer');
    });
  });
});