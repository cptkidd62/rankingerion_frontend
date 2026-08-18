export type BotStatus = {
  type: 'created' | 'compilation_error' | 'playtime_error' | 'ok';
  progress: 'in_progress' | 'saturated' | 'no_more_opponents' | 'failed';
  isDeleted: boolean;
};

export type RatingData = {
  value: number;
  RD: number,
  lastMatchId: number,
  matchesPlayed: number,
  opponentsPlayed: Map<number, number>,

  // trueskill
  trueSkillMu: number;
  trueSkillSigma: number;
};

export interface Bot {
    id: number;
    name: string;
    language: string;
    user_id: number;
    username: string;
    dateCreated: number;
    status: BotStatus;
    errorsCount: number;
    lastErrorMsg: string;
    rating: RatingData;
}