import { Agent } from '../models/agent';
import { PlayResult } from './playresult';
import { PlayTask } from './playtask';

export class BatchContainer {
  public results: PlayResult[];
  constructor(public batch: PlayTask[]) {}
}

export class PlayTaskContainer {
  constructor(
    public index: number,
    public bc: BatchContainer,
  ) {}

  getAgents(): Agent[] {
    return this.bc.batch[this.index].agents;
  }

  getSeed(): bigint {
    return this.bc.batch[this.index].seed;
  }

  getPriority(): number {
    return Number(process.env.DEFAULT_PRIORITY ?? 10);
  }

  getReferee(): string {
    return this.bc.batch[this.index].referee;
  }
}

export class CompileContainer {
  constructor(
    public agent: Agent,
    public referee: string,
    public expectedPlays: number,
  ) {}

  getAgent(): Agent {
    return this.agent;
  }

  getPriority(): number {
    return Number(process.env.DEFAULT_PRIORITY ?? 10);
  }
}
