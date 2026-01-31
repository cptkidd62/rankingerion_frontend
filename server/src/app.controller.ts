import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BenchmarkerService } from './benchmarker/benchmarker.service';
import { ClientService } from './benchmarker/client/client.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly benchmarkerService: BenchmarkerService,
    private readonly clientService: ClientService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('testagent')
  agentTest() {
    this.benchmarkerService.agentTest();
  }

  @Get('testsend')
  sendTest() {
    this.clientService.sendPlayTask();
  }
}
