import { Module } from '@nestjs/common';
import { ClientApiController } from './client-api.controller';
import { ClientApiService } from './client-api.service';
import { NotionModule } from '../services/notion/notion.module';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';

@Module({
  controllers: [ClientApiController, AuthController],
  providers: [ClientApiService, AuthService],
  imports: [NotionModule],
})
export class ClientApiModule {}
