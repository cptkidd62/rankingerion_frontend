import { Injectable } from '@nestjs/common';
import { ClientService } from './client/client.service';
import { PlayTask } from './tasks/playtask';
import { Agent } from './models/agent';

@Injectable()
export class BenchmarkerService {
  constructor(private clientService: ClientService) {}
  async playSingle(bots: string[]) {
    const agents: Agent[] = [];
    bots.forEach((bot) => agents.push(new Agent(bot)));
    try {
      const results = await this.clientService.enqueueBatch([
        new PlayTask(agents, BigInt(2), 'Sandbox'),
      ]);
      console.log('**** OUT Batch results:');
      for (let i = 0; i < results.length; i++) {
        console.log('id: ', i, ', scores: ', results[i].scores);
      }
      console.log('--------');
    } catch (error) {
      console.error(error);
    }
  }
}
