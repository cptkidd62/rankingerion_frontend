import { Agent } from '../models/agent';
import { PlayResult } from './playresult';
import { PlayTask } from './playtask';

export class BatchContainer {
  public results: PlayResult[];
  public playCount: number = 0;
  public promise: Promise<PlayResult[]>;
  private resolve: (value: PlayResult[]) => void;
  private reject: (reason?: any) => void;

  constructor(public batch: PlayTask[]) {
    this.results = new Array<PlayResult>(batch.length);
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  complete() {
    this.resolve(this.results);
  }

  fail(error: any) {
    this.reject(error);
  }
}

export class TaskContainer {
  time = Date.now();
}

export class PlayTaskContainer extends TaskContainer {
  constructor(
    public index: number,
    public bc: BatchContainer,
  ) {
    super();
  }

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

export class CompileContainer extends TaskContainer {
  constructor(
    public agent: Agent,
    public referee: string,
    public expectedPlays: number,
  ) {
    super();
  }

  getAgent(): Agent {
    return this.agent;
  }

  getPriority(): number {
    return Number(process.env.DEFAULT_PRIORITY ?? 10);
  }
}
