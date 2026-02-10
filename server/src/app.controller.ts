import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BenchmarkerService } from './benchmarker/benchmarker.service';
import { ClientService } from './benchmarker/client/client.service';
import { PlayTask } from './benchmarker/tasks/playtask';
import { Agent } from './benchmarker/models/agent';

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
    this.clientService.enqueueBatch([
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(1), 'Sandbox'),
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(2), 'Sandbox'),
      new PlayTask([new Agent('test_bot#b1.cpp')], BigInt(1), 'Sandbox'),
      new PlayTask([new Agent('test_bot#b1.cpp')], BigInt(2), 'Sandbox'),
    ]);
    this.clientService.enqueueBatch([
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(1), 'Sandbox'),
    ]);
  }

  @Get('testsend2')
  sendTest2() {
    this.clientService.enqueueBatch([
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(2), 'Sandbox'),
    ]);
    this.clientService.enqueueBatch([
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(3), 'Sandbox'),
    ]);
  }

  @Get('testsend3')
  sendTest3() {
    this.clientService.enqueueBatch([
      new PlayTask([new Agent('test_bot#b1.cpp')], BigInt(2), 'Sandbox'),
    ]);
  }
}
