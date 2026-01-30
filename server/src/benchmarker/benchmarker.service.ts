import { Injectable } from '@nestjs/common';
import { Agent } from './models/agent';

@Injectable()
export class BenchmarkerService {
  agentTest() {
    const agent = new Agent('randomAgent#r1.java');
    console.log(agent);
  }
}
