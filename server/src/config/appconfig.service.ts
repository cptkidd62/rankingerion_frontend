import { Injectable } from '@nestjs/common';
import { AppConfig, PublicConfig } from './appconfig';
import { BenchmarkerDevConfig, LocalBenchmarkerDevConfig, NoBenchmarker3PlayerDevConfig, NoBenchmarkerDevConfig } from './development';
import { ProdConfig } from './production';
import { accessSync, mkdirSync, copyFileSync } from 'node:fs';

@Injectable()
export class AppConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = LocalBenchmarkerDevConfig;
    this.verifyConfig();
  }

  getPublicConfig(): PublicConfig {
    return {
      acceptedTextExtentions: this.config.acceptedTextExtentions,
      gameName: this.config.gameName,
      playersCount: this.config.playersCount,
      ratingForMatchmaking: this.config.ratingForMatchmaking,
      matchesToPlay: this.config.matchesToPlay,
      maxBotsPerUser: this.config.maxBotsPerUser
    }
  }

  private verifyConfig() {
    if (this.config.playersCount > 2 && this.config.ratingForMatchmaking == 'glicko') {
      throw new Error("Cannot run server with 'playersCount > 2' and 'ratingForMatchmaking == 'glicko''. Please change one of these values.");
    }
    try {
      accessSync(this.config.dataDir);
    } catch {
      mkdirSync(this.config.dataDir, { recursive: true });
    }
    try {
      accessSync(this.config.botsDir);
    } catch {
      mkdirSync(this.config.botsDir, { recursive: true });
    }
    try {
      accessSync(this.config.dataDir + '/' + this.config.usersFile);
    } catch {
      copyFileSync('./example-users.json', this.config.dataDir + '/' + this.config.usersFile);
    }
  }
}
