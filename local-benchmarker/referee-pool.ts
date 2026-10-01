import { MatchResult, Referee } from "./referee";

export class RefereePool {
  private available: Referee[] = [];
  private waiting: Array<(referee: Referee) => void> = [];

  constructor(count: number) {
    for (let i = 0; i < count; i++) {
      const referee = new Referee();
      referee.run();
      this.available.push(referee);
    }
    console.log(`Referee pool started with ${this.available.length} referees`);
  }

  async doMatch(playersCount: number, seed: bigint, agents: string[], agentsOpts: number[], logOpts: number): Promise<MatchResult> {
    const referee = await this.acquire();

    try {
      return await referee.doMatch(playersCount, seed, agents, agentsOpts, logOpts);
    } finally {
      this.release(referee);
    }
  }

  async acquire(): Promise<Referee> {
    const referee = this.available.shift();
    console.log('available: ', this.available.length);
    if (referee !== undefined) {
      return referee;
    }

    return new Promise<Referee>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(referee: Referee) {
    const resolve = this.waiting.shift();

    if (resolve !== undefined) {
      resolve(referee);
    } else {
      this.available.push(referee);
      console.log('available: ', this.available.length);
    }
  }
}
