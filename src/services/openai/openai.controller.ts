import { Controller, Get, Logger, Query } from '@nestjs/common';
import { OpenAiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  private readonly logger: Logger = new Logger(OpenaiController.name);
  constructor(private openAiService: OpenAiService) {}

  @Get('/test')
  async test(@Query('prompt') prompt: string) {
    this.logger.log(await this.openAiService.generateText(prompt));
  }
}
