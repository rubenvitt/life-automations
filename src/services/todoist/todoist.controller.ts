import { Body, Controller, Get, Post } from '@nestjs/common';
import { SettingsService } from '../../settings/settings.service';

@Controller('todoist')
export class TodoistController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('/settings')
  findAllSettings() {
    return this.settingsService.findAll('todoist');
  }

  @Post('/settings')
  updateSettings(@Body() body: { key: string; value: string }) {
    return this.settingsService.update('todoist', body);
  }
}
