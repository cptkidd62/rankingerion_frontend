import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConnectorService } from './benchmarker/connector/connector.service';
import { Socket } from 'net';
import { BenchmarkerService } from './benchmarker/benchmarker.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly connectorService: ConnectorService,
    private readonly benchmarkerService: BenchmarkerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  connectionTest(): Socket {
    const socket = this.connectorService.getSocket(
      String(process.env.BENCHMARKER_SERVER),
      Number(process.env.BENCHMARKER_PORT_CLIENTS),
    );
    return socket;
  }

  @Get('testagent')
  agentTest() {
    this.benchmarkerService.agentTest();
  }
}
