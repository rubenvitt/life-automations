import { Body, Controller, Post } from '@nestjs/common';
import { SettingsService } from '../../settings/settings.service';

@Controller('todoist')
export class TodoistController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('/settings')
  updateSettings(@Body() body: { key: string; value: string }) {
    return this.settingsService.update('todoist', body);
  }
}
