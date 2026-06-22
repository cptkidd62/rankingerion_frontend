import { Module } from '@nestjs/common';
import { BenchmarkerService } from './benchmarker.service';
import { ConnectorService } from './connector/connector.service';
import { ClientService } from './client/client.service';
import { AppConfigService } from 'src/config/appconfig.service';

@Module({
  providers: [
    BenchmarkerService,
    ConnectorService,
    ClientService,
    AppConfigService,
  ],
  exports: [BenchmarkerService],
})
export class BenchmarkerModule {}
