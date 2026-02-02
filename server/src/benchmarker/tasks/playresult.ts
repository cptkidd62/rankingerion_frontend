export class PlayResult {
  constructor(
    public time: bigint,
    public scores: number[],
    public logs: string[],
    public summaries: string,
  ) {}
}
