import {
  Controller,
  Get,
} from '@nestjs/common';
import { AppConfigService } from './appconfig.service';
import { PublicConfig } from './appconfig';

@Controller('config')
export class AppConfigController {
  constructor(
    private readonly appConfigService: AppConfigService
  ) {}

  @Get()
  async getPublicConfig(): Promise<PublicConfig> {
    return this.appConfigService.getPublicConfig();
  }
}
