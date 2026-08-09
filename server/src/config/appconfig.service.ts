import { Injectable } from '@nestjs/common';
import { AppConfig, PublicConfig } from './appconfig';
import { NoBenchmarkerDevConfig } from './development';
// import { DataTestConfig } from './datatestconfig';

@Injectable()
export class AppConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = NoBenchmarkerDevConfig;
  }

  getPublicConfig(): PublicConfig {
    return {
      matchesToPlay: this.config.matchesToPlay,
      maxBotsPerUser: this.config.maxBotsPerUser
    }
  }
}
