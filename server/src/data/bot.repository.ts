export type BotStatus = {
  type: StatusType;
  progress: StatusProgress;
  isDeleted: boolean;
};

export type StatusType = 'created' | 'compilation_error' | 'playtime_error' | 'ok';
export type StatusProgress = 'in_progress' | 'saturated' | 'no_more_opponents' | 'failed';

export type RatingData = {
  value: number;
  RD: number;
  lastMatchId: number;
  matchesPlayed: number;
  opponentsPlayed: Map<number, number>;

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
  filename: string;
  fileHash: string;
  status: BotStatus;
  errorsCount: number;
  lastErrorMsg: string;
  rating: RatingData;
}

export interface BotDTO {
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
  abstract updateErrorLogById(id: number, msg: string, ignore?: boolean): Promise<void>;
  abstract updateStatusTypeById(id: number, statusType: StatusType): Promise<void>;
  abstract updateStatusProgressById(id: number, statusProgress: StatusProgress): Promise<void>;
  abstract updateStatusById(id: number, statusType: StatusType, statusProgress: StatusProgress): Promise<void>;
}
