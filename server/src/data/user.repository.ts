export interface User {
  id: number;
  username: string;
  password: string;
}

export abstract class UserRepository {
  abstract findAll(): Promise<User[]>;
  abstract findById(id: number): Promise<User | null>;
  abstract findByUsername(username: string): Promise<User | null>;
  abstract create(user: User): Promise<User | null>;
  abstract deleteById(id: number): Promise<void>;
  abstract updatePassword(id: number, password: string): Promise<void>;
}
