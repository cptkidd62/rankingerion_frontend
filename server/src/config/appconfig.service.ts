import { Injectable } from '@nestjs/common';
import { AppConfig, PublicConfig } from './appconfig';
// import { NoBenchmarkerDevConfig } from './development';
import { ProdConfig } from './production';

@Injectable()
export class AppConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = ProdConfig;
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
