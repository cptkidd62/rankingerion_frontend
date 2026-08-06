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
  RD: number,
  lastMatchId: number,
  matchesPlayed: number,
  opponentsPlayed: Map<number, number>,
};

export interface Bot {
    id: number;
    name: string;
    language: string;
    user_id: number;
    username: string;
    status: BotStatus;
    rating: RatingData;
}