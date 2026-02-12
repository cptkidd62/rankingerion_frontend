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

  @Get('testsend')
  async sendTest() {
    await this.clientService.enqueueBatch([
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(1), 'Sandbox'),
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(2), 'Sandbox'),
      new PlayTask([new Agent('test_bot#b1.cpp')], BigInt(1), 'Sandbox'),
      new PlayTask([new Agent('test_bot#b1.cpp')], BigInt(2), 'Sandbox'),
    ]);
    await this.clientService.enqueueBatch([
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(1), 'Sandbox'),
    ]);
  }

  @Get('testsend2')
  async sendTest2() {
    await this.clientService.enqueueBatch([
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(2), 'Sandbox'),
    ]);
    await this.clientService.enqueueBatch([
      new PlayTask([new Agent('randomScore#r1.cpp')], BigInt(3), 'Sandbox'),
    ]);
  }

  @Get('testsend3')
  async sendTest3() {
    await this.clientService.enqueueBatch([
      new PlayTask([new Agent('test_bot#b1.cpp')], BigInt(2), 'Sandbox'),
    ]);
  }

  @Get('testsend4')
  async sendTest4() {
    await this.clientService.enqueueBatch([
      new PlayTask(
        [new Agent('test_bot#b1.cpp'), new Agent('randomScore#r1.cpp')],
        BigInt(7),
        'Sandbox',
      ),
    ]);
  }

  @Get('testapi')
  async testAPI() {
    await this.benchmarkerService.playSingle([
      'test_bot#b1.cpp',
      'randomScore#r1.cpp',
    ]);
  }
}
