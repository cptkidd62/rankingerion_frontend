import { Injectable } from '@nestjs/common';
import { User, UserRepository } from '../user.repository';

@Injectable()
export class InMemoryUserRepository extends UserRepository {
  private users: User[] = [
    {
      id: 1,
      name: 'John',
      login: 'john',
      email: 'john@mail.com',
      password: 'abc',
    },
    {
      id: 2,
      name: 'Kate',
      login: 'kate',
      email: 'kate@mail.com',
      password: 'abcd',
    },
  ];

  private nextId = 3;

  async findAll(): Promise<User[]> {
    await Promise.resolve();
    return this.users;
  }

  async findById(id: number): Promise<User | null> {
    await Promise.resolve();
    return this.users.find((user) => user.id == id) || null;
  }

  async findByLoginOrEmail(logmail: string): Promise<User | null> {
    await Promise.resolve();
    return (
      this.users.find(
        (user) => user.login === logmail || user.email === logmail,
      ) || null
    );
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
