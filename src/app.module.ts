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
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'lifeautomations',
      password: process.env.DB_PASSWORD || 'lifeautomations',
      database: process.env.DB_NAME || 'lifeautomations',
      entities: [Settings],
      synchronize: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
