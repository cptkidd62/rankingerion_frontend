export interface User {
  id: number;
  name: string;
  email: string;
  login: string;
  password: string;
}

export abstract class UserRepository {
  abstract findAll(): Promise<User[]>;
  abstract findById(id: number): Promise<User | null>;
  abstract findByLoginOrEmail(logmail: string): Promise<User | null>;
  abstract create(user: User): Promise<User | null>;
  abstract deleteById(id: number): Promise<void>;
}
