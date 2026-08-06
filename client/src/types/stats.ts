export type OpponentSummary = {
  botname: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
}

export type Summary = Map<number, OpponentSummary>
