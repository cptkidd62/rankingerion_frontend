import { Injectable } from '@nestjs/common';
import { AppConfig } from './appconfig';
import { NoBenchmarkerDevConfig } from './development';
// import { DataTestConfig } from './datatestconfig';

@Injectable()
export class AppConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = NoBenchmarkerDevConfig;
  }
}
