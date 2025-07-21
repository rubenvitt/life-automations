import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { NotionService } from '../notion/notion.service';
import { TodoistService } from '../todoist/todoist.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let notionService: jest.Mocked<NotionService>;
  let todoistService: jest.Mocked<TodoistService>;

  beforeEach(async () => {
    const mockNotionService = {
      projectService: jest.fn().mockReturnValue({
        findActiveProjects: jest.fn(),
        findActiveLebensbereiche: jest.fn(),
      }),
    };

    const mockTodoistService = {
      getProjectStats: jest.fn(),
      getWeeklyStats: jest.fn(),
      getMonthlyStats: jest.fn(),
      getCompletedTasks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: NotionService, useValue: mockNotionService },
        { provide: TodoistService, useValue: mockTodoistService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    notionService = module.get(NotionService);
    todoistService = module.get(TodoistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProjectProductivityAnalysis', () => {
    it('should return empty array when no projects exist', async () => {
      notionService.projectService().findActiveProjects.mockResolvedValue({ results: [] });
      notionService.projectService().findActiveLebensbereiche.mockResolvedValue({ results: [] });

      const result = await service.getProjectProductivityAnalysis();

      expect(result).toEqual([]);
    });
  });

  describe('getProductivitySummary', () => {
    it('should return empty summary when no projects exist', async () => {
      notionService.projectService().findActiveProjects.mockResolvedValue({ results: [] });
      notionService.projectService().findActiveLebensbereiche.mockResolvedValue({ results: [] });

      const result = await service.getProductivitySummary();

      expect(result.totalProjects).toBe(0);
      expect(result.averageCompletionRate).toBe(0);
    });
  });
});