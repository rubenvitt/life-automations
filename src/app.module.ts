import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServicesModule } from './services/services.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsModule } from './jobs/jobs.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from './settings/Settings.entity';
import { SettingsModule } from './settings/settings.module';
import { ClientApiModule } from './client-api/client-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/data.db',
      entities: [Settings],
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    JobsModule,
    ServicesModule,
    SettingsModule,
    ClientApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
