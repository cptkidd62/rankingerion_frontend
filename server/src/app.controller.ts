import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BenchmarkerService } from './benchmarker/benchmarker.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly benchmarkerService: BenchmarkerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('testapi')
  async testAPI() {
    await this.benchmarkerService.playSingle([
      'test_err#e1.cpp',
      'randomScore#r1.cpp',
    ]);
  }

  @Get('testapi2')
  async testAPI2() {
    await this.benchmarkerService.playAgainst('test_bot#b2.cpp', [
      ['test_bot#b1.cpp'],
      ['randomScore#r1.cpp'],
    ]);
  }
}
