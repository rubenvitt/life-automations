import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotionService } from '../notion/notion.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let notionService: jest.Mocked<NotionService>;

  beforeEach(async () => {
    const mockAnalyticsService = {
      getProductivitySummary: jest.fn(),
      getProjectProductivityAnalysis: jest.fn(),
    };

    const mockNotionService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: NotionService, useValue: mockNotionService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    analyticsService = module.get(AnalyticsService);
    notionService = module.get(NotionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateWeeklySummary', () => {
    it('should generate weekly summary report', async () => {
      const mockSummary = {
        totalProjects: 5,
        averageCompletionRate: 75,
        mostProductiveProject: null,
        leastProductiveProject: null,
        topLebensbereiche: [],
        overallTrend: 'up' as const,
      };

      const mockAnalysis = [
        {
          notionProjectId: '1',
          notionProjectName: 'Test Project',
          completionRate: 80,
          activeTasks: 5,
          completedTasks: 20,
          totalTasks: 25,
          overdueTasks: 1,
          weeklyProgress: 3,
          monthlyProgress: 15,
          trend: 'up' as const,
          lebensbereich: 'Work',
        },
      ];

      analyticsService.getProductivitySummary.mockResolvedValue(mockSummary);
      analyticsService.getProjectProductivityAnalysis.mockResolvedValue(mockAnalysis);

      const result = await service.generateWeeklySummary();

      expect(result).toBeDefined();
      expect(result.summary).toEqual(mockSummary);
      expect(result.period).toContain('-');
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });
});