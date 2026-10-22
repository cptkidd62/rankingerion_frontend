export type OpponentSummary = {
  botname: string;
  username: string;
  user_id: number;
  wins: number;
  losses: number;
  draws: number;
  winrate: number;
  rankDelta: number | null;
}

export type Summary = Map<number, [OpponentSummary, boolean]>
