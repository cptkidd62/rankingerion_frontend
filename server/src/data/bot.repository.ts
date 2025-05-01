export interface Bot {
  id: number;
  name: string;
  file: string;
  userId: number;
}

export abstract class BotRepository {
  abstract findAll(): Promise<Bot[]>;
  abstract findById(id: number): Promise<Bot | null>;
  abstract filterByUserId(id: number): Promise<Bot[]>;
  abstract create(user: Bot): Promise<void>;
  abstract deleteById(id: number): Promise<void>;
}
