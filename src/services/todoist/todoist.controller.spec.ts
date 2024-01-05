import { Test, TestingModule } from '@nestjs/testing';
import { TodoistController } from './todoist.controller';

describe('TodoistController', () => {
  let controller: TodoistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoistController],
    }).compile();

    controller = module.get<TodoistController>(TodoistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
