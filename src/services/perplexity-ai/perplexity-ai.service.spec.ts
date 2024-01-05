import { Test, TestingModule } from '@nestjs/testing';
import { PerplexityAiService } from './perplexity-ai.service';

describe('PerplexityAiService', () => {
  let service: PerplexityAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerplexityAiService],
    }).compile();

    service = module.get<PerplexityAiService>(PerplexityAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
