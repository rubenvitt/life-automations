import { Test, TestingModule } from '@nestjs/testing';
import { PerplexityAiController } from './perplexity-ai.controller';

describe('PerplexityAiController', () => {
  let controller: PerplexityAiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerplexityAiController],
    }).compile();

    controller = module.get<PerplexityAiController>(PerplexityAiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
