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
    };

export interface Bot {
    id: number;
    name: string;
    language: string;
    user_id: number;
    status: BotStatus;
    rating: number | undefined;
}