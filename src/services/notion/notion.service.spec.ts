import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PerplexityAiService } from '../perplexity-ai/perplexity-ai.service';
import { NotionAuthService } from './notion-auth/notion-auth.service';
import { NotionService } from './notion.service';
import { ProjectsService } from './projects/projects.service';

describe('NotionService', () => {
  let service: NotionService;
  let perplexityAiService: jest.Mocked<PerplexityAiService>;

  beforeEach(async () => {
    perplexityAiService = {
      sendPrompt: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotionService,
        {
          provide: NotionAuthService,
          useValue: {
            notion: () => ({}),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('mock-id'),
          },
        },
        {
          provide: PerplexityAiService,
          useValue: perplexityAiService,
        },
        {
          provide: ProjectsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<NotionService>(NotionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSpecialText', () => {
    it('should remove think tags from perplexity response', async () => {
      const mockResponse = `<think>
Some reasoning about the response
</think>

This is the actual response`;

      perplexityAiService.sendPrompt.mockResolvedValue(mockResponse);

      const result = await service.generateSpecialText();

      expect(result).toBe('This is the actual response');
      expect(perplexityAiService.sendPrompt).toHaveBeenCalled();
    });
  });
});
