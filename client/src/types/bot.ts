export type BotStatus = {
  type: 'created' | 'compilation_error' | 'playtime_error' | 'ok' | 'deleted';
  progress: 'in_progress' | 'saturated' | 'no_more_opponents' | 'failed';
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