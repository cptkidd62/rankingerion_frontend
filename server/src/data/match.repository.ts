export interface Match {
  bot_id1: number;
  botname1: string;
  user_id1: number;
  username1: string;
  bot_id2: number;
  botname2: string;
  user_id2: number;
  username2: string;
  scores: [number, number][];
}

export abstract class MatchRepository {
  abstract findAll(): Promise<Match[]>;
  abstract findById(id1: number, id2: number): Promise<Match | null>;
  abstract filterByBotIds(ids: number[]): Promise<Match[]>;
  abstract create(user: Match): Promise<void>;
}
