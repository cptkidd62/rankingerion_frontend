import { Injectable } from '@nestjs/common';
import { AppConfig, PublicConfig } from './appconfig';
// import { NoBenchmarkerDevConfig } from './development';
import { ProdConfig } from './production';

@Injectable()
export class AppConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = ProdConfig;
    if (this.config.playersCount > 2 && this.config.ratingForMatchmaking == 'glicko') {
      throw new Error("Cannot run server with 'playersCount > 2' and 'ratingForMatchmaking == 'glicko''. Please change one of these values.");
    }
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
