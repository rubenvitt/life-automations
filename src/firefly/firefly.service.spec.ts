import { Test, TestingModule } from '@nestjs/testing';
import { FireflyService } from './firefly.service';

describe('FireflyService', () => {
  let service: FireflyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FireflyService],
    }).compile();

    service = module.get<FireflyService>(FireflyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
