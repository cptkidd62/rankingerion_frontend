import { Injectable } from '@nestjs/common';
import { AppConfig } from './appconfig';
import { NoBenchmarkerDevConfig } from './development';

@Injectable()
export class AppConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = NoBenchmarkerDevConfig;
  }
}
