import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { ClientApiService } from './client-api.service';

@Controller('client-api')
export class ClientApiController {
  private readonly logger: Logger = new Logger(ClientApiController.name);

  constructor(private readonly clientApiService: ClientApiService) {}

  @Post('/moment')
  createMoment(@Body() moment: { name: string; momentTypeId: string }) {
    this.logger.log('Creating moment', moment);
    return this.clientApiService.createMoment(moment);
  }

  @Post('/daily-goals')
  setDailyGoal(@Body() { goals }: { goals: string[] }) {
    this.logger.log('Creating daily goals:', goals);

    return this.clientApiService.setDailyGoals(goals);
  }

  @Get('daily-goals')
  findDailyGoals() {
    const goals = this.clientApiService.findDailyGoals();
    this.logger.log('Found daily goals', goals);
    return goals;
  }

  @Get('moment-types')
  getMomentTypes() {
    return this.clientApiService.findMomentTypes();
  }
}
