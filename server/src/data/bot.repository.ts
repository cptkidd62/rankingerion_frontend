import { RatingVersion } from './rating.service';

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
};

export interface Bot {
  id: number;
  name: string;
  language: string;
  user_id: number;
  status: BotStatus;
  rating: Record<RatingVersion, RatingData> | undefined;
}

export abstract class BotRepository {
  abstract findAll(): Promise<Bot[]>;
  abstract findById(id: number): Promise<Bot | null>;
  abstract filterByUserId(id: number): Promise<Bot[]>;
  abstract create(bot: Bot): Promise<number>;
  abstract deleteById(id: number): Promise<void>;
  abstract updateById(id: number, bot: Bot): Promise<void>;
  abstract updateRatingById(
    id: number,
    rating: number,
    ratingVersion: RatingVersion,
  ): Promise<void>;
}
