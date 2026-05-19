export interface Match {
  id: number;
  bot_ids: number[];
  botnames: string[];
  user_ids: number[];
  usernames: string[];
  score: number[];
}

export abstract class MatchRepository {
  abstract findAll(): Promise<Match[]>;
  abstract findById(id1: number, id2: number): Promise<Match | null>;
  abstract filterByBotIds(ids: number[]): Promise<Match[]>;
  abstract create(user: Match): Promise<number>;
}
