import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from './Settings.entity';
import { Repository } from 'typeorm';

function asPrefix(namespace: string) {
  return namespace.toUpperCase() + '_';
}

@Injectable()
export class SettingsService {
  private readonly logger: Logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Settings) private repository: Repository<Settings>,
  ) {}

  public async findSilently(namespace: string, key: string) {
    const [result] = await Promise.all([
      this.repository.findOne({
        where: {
          id: asPrefix(namespace) + key,
        },
      }),
    ]);

    if (result === null) {
    } else return result.value;
  }

  update(namespace: string, setting: { key: string; value: string }) {
    return this.repository.upsert(
      {
        id: asPrefix(namespace) + setting.key,
        value: setting.value,
      },
      {
        conflictPaths: {
          id: true,
        },
        upsertType: 'on-conflict-do-update',
      },
    );
  }
}
