import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../../settings/settings.service';
import { randomBytes } from 'crypto';

@Controller('client-api/auth')
export class AuthController {
  private registrationKey: string;
  private readonly logger: Logger = new Logger(AuthController.name);

  constructor(
    configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {
    this.registrationKey = configService.getOrThrow(
      'CLIENT_API_REGISTRATION_KEY',
    );
  }

  @Post('/register')
  async registerMobileApp(
    @Req() req: Request,
    @Body() { clientId }: { clientId: string },
  ) {
    const token = req.headers['registration-token'];
    this.logger.log('Try to register new mobile app');
    if (token !== this.registrationKey) {
      throw new ForbiddenException(undefined, 'registration-token not valid');
    }
    if (!clientId) {
      throw new BadRequestException({ clientId: 'missing, but expected' });
    }
    this.logger.verbose('Auth token was valid');

    const appSecret = randomBytes(Math.ceil(32 / 2))
      .toString('hex')
      .slice(0, 32);

    await this.settingsService.update('secret', {
      key: clientId,
      value: appSecret,
    });

    return {
      appSecret: appSecret,
    };
  }
}
