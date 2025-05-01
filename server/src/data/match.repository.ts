export interface Match {
  id: number;
  bot1id: number;
  bot2id: number;
  score1: number;
  score2: number;
}

export interface MatchFull {
  id: number;
  bot1id: number;
  bot1name: string;
  bot2id: number;
  bot2name: string;
  score1: number;
  score2: number;
}

export abstract class MatchRepository {
  abstract findAll(): Promise<Match[]>;
  abstract findById(id: number): Promise<Match | null>;
  abstract filterByBotIds(ids: number[]): Promise<Match[]>;
  abstract create(user: Match): Promise<void>;
}
