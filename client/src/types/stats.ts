export type OpponentSummary = {
  wins: number;
  losses: number;
  draws: number;
}

export type Summary = Map<number, OpponentSummary>
