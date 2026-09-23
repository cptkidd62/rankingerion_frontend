import { Injectable } from '@nestjs/common';
import { ClientService } from './client/client.service';
import { PlayTask } from './tasks/playtask';
import { Agent } from './models/agent';
import { PlayResult } from './tasks/playresult';
import {
  CompilationError,
  ConnectionError,
  PlayTaskError,
  PlaytimeError,
} from '@/errors/PlayErrors';
import * as path from 'path';
import { AppConfigService } from '@/config/appconfig.service';

@Injectable()
export class BenchmarkerService {
  constructor(private readonly clientService: ClientService, private readonly appConfigService: AppConfigService) { }

  async playSingle(bots: string[]): Promise<PlayResult | PlayTaskError> {
    if (!this.clientService.isConnected) return new ConnectionError();
    const agents: Agent[] = [];
    bots.forEach((bot) => agents.push(new Agent(bot)));
    try {
      const results = await this.clientService.enqueueBatch([
        new PlayTask(agents, this.randomLong(), this.appConfigService.config.referee),
      ]);
      console.log('**** OUT Batch results:');
      for (let i = 0; i < results.length; i++) {
        console.log('id: ', i, ', scores: ', results[i].scores);
      }
      console.log('--------');
      return results[0];
    } catch (error) {
      console.error(error);
      if (typeof error === 'string') {
        if (error == 'connectionError') {
          return new ConnectionError();
        }
        const match = error.match(/^(.+) is not compiled$/);
        if (match) {
          const [, name] = match;
          const idx = bots.findIndex((bot) => path.parse(bot).name === name);
          return new CompilationError(idx, name);
        } else {
          return new PlaytimeError(error);
        }
      }
      throw Error('unknown error type ' + error);
    }
  }

  private randomLong(): bigint {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);

    let value = 0n;

    for (const byte of bytes) {
      value = (value << 8n) | BigInt(byte);
    }

    if (value >= 2n ** 63n) {
      value -= 2n ** 64n;
    }

    return value;
  }
}
