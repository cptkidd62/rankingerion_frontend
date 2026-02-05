import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BenchmarkerService } from './benchmarker/benchmarker.service';
import { ClientService } from './benchmarker/client/client.service';
import {
  BatchContainer,
  PlayTaskContainer,
} from './benchmarker/tasks/containers';
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
    this.clientService.sendPlayTask(
      new PlayTaskContainer(
        0,
        new BatchContainer([
          new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(2), 'Sandbox'),
        ]),
      ),
    );
  }
}
