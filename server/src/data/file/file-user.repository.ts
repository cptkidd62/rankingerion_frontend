import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { User, UserRepository } from '../user.repository';

interface UserFileData {
  next_id: number;
  users: User[];
}

@Injectable()
export class FileUserRepository extends UserRepository implements OnModuleInit {
  private users: User[] = [];
  private nextId = 0;

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.loadData();
  }

  private async loadData() {
    const dataDir = process.env.DATA_DIR ?? './';
    const fileName = process.env.USERS_FILE ?? 'users.json';
    const filePath = path.join(dataDir, fileName);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data: UserFileData = JSON.parse(raw) as UserFileData;
      this.users = data.users;
      this.nextId = data.next_id;
    } catch (err) {
      console.error('Błąd wczytywania users.json:', err);
      // jeśli plik nie istnieje — inicjuj puste dane
      this.users = [];
      this.nextId = 0;
    }
  }

  async findAll(): Promise<User[]> {
    await Promise.resolve();
    return this.users;
  }

  async findById(id: number): Promise<User | null> {
    await Promise.resolve();
    return this.users.find((user) => user.id == id) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    await Promise.resolve();
    return this.users.find((user) => user.username === username) ?? null;
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
