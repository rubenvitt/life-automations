import { Test, TestingModule } from '@nestjs/testing';
import { ClientApiService } from './client-api.service';

describe('AppService', () => {
  let service: ClientApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientApiService],
    }).compile();

    service = module.get<ClientApiService>(ClientApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
