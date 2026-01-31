import { Module } from '@nestjs/common';
import { BenchmarkerService } from './benchmarker.service';
import { ConnectorService } from './connector/connector.service';
import { ClientService } from './client/client.service';

@Module({
  providers: [BenchmarkerService, ConnectorService, ClientService],
  exports: [BenchmarkerService, ClientService],
})
export class BenchmarkerModule {}
