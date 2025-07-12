export interface Bot {
  id: number;
  name: string;
  language: string;
  user_id: number;
}

export abstract class BotRepository {
  abstract findAll(): Promise<Bot[]>;
  abstract findById(id: number): Promise<Bot | null>;
  abstract filterByUserId(id: number): Promise<Bot[]>;
  abstract create(user: Bot): Promise<number>;
  abstract deleteById(id: number): Promise<void>;
}
