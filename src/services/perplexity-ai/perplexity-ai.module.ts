import { Module } from '@nestjs/common';
import { PerplexityAiService } from './perplexity-ai.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [PerplexityAiService],
  exports: [PerplexityAiService],
})
export class PerplexityAiModule {}
