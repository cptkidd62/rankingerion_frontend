import { Agent } from '../models/agent';

export class PlayTask {
  constructor(
    public agents: Agent[],
    public seed: bigint,
    public referee: string,
  ) {}
}
