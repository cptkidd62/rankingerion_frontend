import { Injectable } from '@nestjs/common';
import { User, UserRepository } from '../user.repository';

@Injectable()
export class InMemoryUserRepository extends UserRepository {
  private users: User[] = [
    {
      id: 0,
      username: 'john',
      password: 'abc',
    },
    {
      id: 1,
      username: 'kate',
      password: 'abcd',
    },
  ];

  private nextId = 2;

  async findAll(): Promise<User[]> {
    await Promise.resolve();
    return this.users;
  }

  async findById(id: number): Promise<User | null> {
    await Promise.resolve();
    return this.users.find((user) => user.id == id) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    await Promise.resolve();
    return this.users.find((user) => user.username === username) || null;
  }

  async create(user: User): Promise<User | null> {
    await Promise.resolve();
    user.id = this.nextId++;
    this.users.push(user);
    return user;
  }

  async deleteById(id: number): Promise<void> {
    await Promise.resolve();
    this.users = this.users.filter((user) => user.id != id);
  }
}
