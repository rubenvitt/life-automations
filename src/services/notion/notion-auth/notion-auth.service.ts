import { Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotionAuthService {
  private readonly _notion: Client;
  constructor(configService: ConfigService) {
    const notionApiKey = configService.getOrThrow<string>('NOTION_API_KEY');
    this._notion = new Client({
      auth: notionApiKey,
    });
  }

  notion() {
    return this._notion;
  }
}
