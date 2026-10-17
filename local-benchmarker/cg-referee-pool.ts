import { CGReferee } from "./cg-referee";
import { MatchResult } from "./referee";

export class CGRefereePool {
  private available: CGReferee[] = [];
  private waiting: Array<(referee: CGReferee) => void> = [];

  constructor(count: number) {
    for (let i = 0; i < count; i++) {
      const referee = new CGReferee();
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

  async acquire(): Promise<CGReferee> {
    const referee = this.available.shift();
    console.log('available: ', this.available.length);
    if (referee !== undefined) {
      return referee;
    }

    return new Promise<CGReferee>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(referee: CGReferee) {
    const resolve = this.waiting.shift();

    if (resolve !== undefined) {
      resolve(referee);
    } else {
      this.available.push(referee);
      console.log('available: ', this.available.length);
    }
  }
}
