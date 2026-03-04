import { Injectable } from '@nestjs/common';
import { ClientService } from './client/client.service';
import { PlayTask } from './tasks/playtask';
import { Agent } from './models/agent';
import { PlayResult } from './tasks/playresult';
import { randomInt } from 'crypto';
import { CompileContainer } from './tasks/containers';

@Injectable()
export class BenchmarkerService {
  constructor(private clientService: ClientService) {}

  async playSingle(bots: string[]): Promise<PlayResult | undefined> {
    const agents: Agent[] = [];
    bots.forEach((bot) => agents.push(new Agent(bot)));
    try {
      const results = await this.clientService.enqueueBatch([
        new PlayTask(agents, BigInt(randomInt(1000)), 'Sandbox'),
      ]);
      console.log('**** OUT Batch results:');
      for (let i = 0; i < results.length; i++) {
        console.log('id: ', i, ', scores: ', results[i].scores);
      }
      console.log('--------');
      return results[0];
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  async playAgainst(
    bot: string,
    others: string[][],
  ): Promise<PlayResult[] | undefined> {
    const agentsList: Agent[][] = [];
    for (let i = 0; i < others.length; i++) {
      agentsList[i] = [];
      agentsList[i].push(new Agent(bot));
      others[i].forEach((other) => agentsList[i].push(new Agent(other)));
    }
    try {
      const results = await this.clientService.enqueueBatch(
        agentsList.map((agents) => {
          return new PlayTask(agents, BigInt(randomInt(1000)), 'Sandbox');
        }),
      );
      console.log('**** OUT2 Batch results:');
      for (let i = 0; i < results.length; i++) {
        console.log('id: ', i, ', scores: ', results[i].scores);
      }
      console.log('--------');
      return results;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  async compileAgent(bot: string): Promise<string> {
    const res = await this.clientService.enqueueCompile(
      new CompileContainer(new Agent(bot), 'Sandbox', 10),
    );
    console.log('Compilation results: ', res.msg);
    return res.msg;
  }
}
