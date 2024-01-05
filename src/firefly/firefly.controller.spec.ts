import { Test, TestingModule } from '@nestjs/testing';
import { FireflyController } from './firefly.controller';

describe('FireflyController', () => {
  let controller: FireflyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FireflyController],
    }).compile();

    controller = module.get<FireflyController>(FireflyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
