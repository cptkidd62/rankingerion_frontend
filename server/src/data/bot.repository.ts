export type BotStatus =
  | {
    type: 'created';
  }
  | {
    type: 'compilation_error';
  }
  | {
    type: 'playtime_error';
  }
  | {
    type: 'ok';
  }
  | {
    type: 'deleted';
  };

export type RatingData = {
  value: number;
  RD: number;
  lastMatchId: number;
  matchesPlayed: number;
  opponentsPlayed: Map<number, number>;
};

export interface Bot {
  id: number;
  name: string;
  language: string;
  user_id: number;
  username: string;
  filename: string;
  status: BotStatus;
  rating: RatingData;
}

export interface BotDTO {
  id: number;
  name: string;
  language: string;
  user_id: number;
  username: string;
  status: BotStatus;
  rating: RatingData;
}

export interface BotFileData {
  filename: string;
  mimeType: string;
  contents: Buffer;
}

export abstract class BotRepository {
  abstract findAll(): Promise<Bot[]>;
  abstract findById(id: number): Promise<Bot | null>;
  abstract filterByUserId(id: number): Promise<Bot[]>;
  abstract create(bot: Bot): Promise<number>;
  abstract deleteById(id: number): Promise<void>;
  abstract updateById(id: number, bot: Bot): Promise<void>;
  abstract updateNameById(id: number, name: string): Promise<void>;
  abstract updateRatingById(id: number, rating: RatingData): Promise<void>;
}
