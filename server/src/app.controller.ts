import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BenchmarkerService } from './benchmarker/benchmarker.service';
import { CompilationError, PlayTaskError } from './errors/PlayErrors';

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

  // @Get('testcomerr')
  // async testComErr() {
  //   await this.benchmarkerService.compileAgent('test_err#e2.cpp');
  // }

  // @Get('testcomsuc')
  // async testComSuc() {
  //   await this.benchmarkerService.compileAgent('test_bot#b6.cpp');
  // }

  @Get('testapi')
  async testAPI() {
    const res = await this.benchmarkerService.playSingle([
      'test_err#e4.cpp',
      'test_bot#b1.cpp',
    ]);
    console.log('HERE');
    if (res instanceof PlayTaskError) {
      if (res instanceof CompilationError) {
        console.error(
          'compilation error of bot %s on index %d',
          res.agentName,
          res.agentIndex,
        );
      } else {
        console.error('PlayTaskError');
      }
    }
  }

  // @Get('testapi2')
  // async testAPI2() {
  //   await this.benchmarkerService.playAgainst('test_bot#b2.cpp', [
  //     ['test_bot#b1.cpp'],
  //     ['randomScore#r1.cpp'],
  //   ]);
  // }
}
