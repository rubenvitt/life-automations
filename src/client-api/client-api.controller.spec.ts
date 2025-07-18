import { Test, TestingModule } from '@nestjs/testing';
import { ClientApiController } from './client-api.controller';

describe('AppController', () => {
  let controller: ClientApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientApiController],
    }).compile();

    controller = module.get<ClientApiController>(ClientApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
