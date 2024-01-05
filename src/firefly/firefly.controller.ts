import { Controller, Get, Post } from '@nestjs/common';
import { FireflyService } from './firefly.service';
import { format, formatISO } from 'date-fns';

@Controller('firefly')
export class FireflyController {
  constructor(private readonly fireflyService: FireflyService) {}

  @Get('/rules')
  findAllRules() {
    return this.fireflyService.findAllRules();
  }

  @Get('notion-bills')
  async findAllNotionBills() {
    return this.fireflyService.collectAllNotionBills(false);
  }

  @Post('sync-bills')
  async syncBills() {
    const billIds = await this.fireflyService.syncBills();
    return { message: `synced ${billIds.length} bills`, ids: billIds };
  }

  @Get('/bills')
  findAllBills() {
    return this.fireflyService.findAllBills();
  }

  @Post('/bills')
  createBill() {
    return this.fireflyService.createBill({
      amount_max: '11',
      amount_min: '1',
      date: formatISO(new Date(), { format: 'basic' }),
      repeat_freq: 'monthly',
      name: 'mein Test ' + format(new Date(), 'HH:mm:ss'),
      active: true,
      object_group_title: 'Test',
    });
  }
}
