import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;
  constructor(configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: configService.getOrThrow('OPENAI_API_KEY'),
    });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.openai.completions.create({
        model: 'gpt-3.5-turbo-instruct', // oder ein anderes Modell deiner Wahl
        prompt: prompt,
        max_tokens: 100,
      });
      return response.choices[0].text.trim();
    } catch (error) {
      console.error('Fehler beim Generieren des Textes: ', error);
      throw error;
    }
  }
}
