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
    userId: number;
    status: BotStatus;
}