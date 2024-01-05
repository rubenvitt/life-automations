import { Body, Controller, Get, Post } from '@nestjs/common';
import { SettingsService } from '../../settings/settings.service';
import { NotionService } from './notion.service';

@Controller('notion')
export class NotionController {
  constructor(
    private settingsService: SettingsService,
    private notionService: NotionService,
  ) {}

  @Get('/settings')
  findAllSettings() {
    return this.settingsService.findAll('notion');
  }

  @Post('/settings')
  updateSettings(@Body() body: { key: string; value: string }) {
    return this.settingsService.update('notion', body);
  }

  @Get('/database')
  async findAllDatabases() {
    const databases = await this.notionService.findAllNotionDatabases();
    return databases
      .map((value) => ({
        id: value.id,
        title: value.title[0]?.plain_text,
      }))
      .filter((value) => value.title);
  }
}
