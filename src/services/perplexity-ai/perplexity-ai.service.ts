import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Model, Payload, Prompt } from './perplexity';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class PerplexityAiService {
  private readonly accessToken: string;
  private apiBaseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor(
    private httpService: HttpService,
    configService: ConfigService,
  ) {
    this.accessToken = configService.getOrThrow('PERPLEXITY_API_KEY');
  }

  public async sendPrompt(
    prompt: string,
    model: Model = 'pplx-7b-online',
    systemPrompt?: Prompt,
  ) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
    };

    const payload: Payload = {
      model: model,
      messages: [systemPrompt, { content: prompt, role: 'user' }].filter(
        (value) => value,
      ) as Prompt[],
    };

    return firstValueFrom(
      this.httpService
        .post(this.apiBaseUrl, payload, { headers })
        .pipe(map((response) => response.data))
        .pipe(map((data) => data['choices'][0]['message']['content'])),
    );
  }
}
