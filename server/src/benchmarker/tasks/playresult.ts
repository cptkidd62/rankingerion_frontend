export class PlayResult {
  constructor(
    public time: bigint,
    public scores: number[],
    public logs: string[],
    public summaries: string,
  ) {}

  static Error(msg: string): PlayResult {
    return new PlayResult(BigInt(-1), [], [], msg);
  }
}
