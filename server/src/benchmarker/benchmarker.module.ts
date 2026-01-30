import { Module } from '@nestjs/common';
import { BenchmarkerService } from './benchmarker.service';
import { ConnectorService } from './connector/connector.service';

@Module({
  providers: [BenchmarkerService, ConnectorService],
  exports: [BenchmarkerService, ConnectorService],
})
export class BenchmarkerModule {}
