import { Injectable } from '@nestjs/common';
import { AppConfig, PublicConfig } from './appconfig';
import { BenchmarkerDevConfig } from './development';
// import { DataTestConfig } from './datatestconfig';

@Injectable()
export class AppConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = BenchmarkerDevConfig;
  }

  getPublicConfig(): PublicConfig {
    return {
      acceptedTextExtentions: this.config.acceptedTextExtentions,
      gameName: this.config.gameName,
      matchesToPlay: this.config.matchesToPlay,
      maxBotsPerUser: this.config.maxBotsPerUser
    }
  }
}
