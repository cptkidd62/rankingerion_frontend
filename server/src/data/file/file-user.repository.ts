import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { User, UserRepository } from '../user.repository';
import { AppConfigService } from 'src/config/appconfig.service';

interface UserFileData {
  next_id: number;
  users: User[];
}

@Injectable()
export class FileUserRepository extends UserRepository implements OnModuleInit {
  private users: User[] = [];
  private nextId = 0;
  private dirty: boolean = false;

  constructor(private readonly appConfig: AppConfigService) {
    super();
  }

  async onModuleInit() {
    await this.loadData();
  }

  private async loadData() {
    const dataDir = this.appConfig.config.dataDir;
    const fileName = this.appConfig.config.usersFile;
    const filePath = path.join(dataDir, fileName);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data: UserFileData = JSON.parse(raw) as UserFileData;
      this.users = data.users;
      this.nextId = data.next_id;
    } catch (err) {
      console.error('Error reading users.json:', err);
      // initialize empty data if file does not exist
      this.users = [];
      this.nextId = 0;
    }
  }

  async saveData() {
    const data: UserFileData = {
      next_id: this.nextId,
      users: this.users,
    };
    if (this.dirty) {
      const json = JSON.stringify(
        data,
        (_, value: unknown) => {
          if (value instanceof Map) {
            return [...value];
          }
          return value;
        },
        2,
      );
      this.dirty = false;

      const dataDir = this.appConfig.config.dataDir;
      const fileName = this.appConfig.config.usersFile;
      const filePath = path.join(dataDir, fileName);
      const tmpPath = filePath + '.tmp';
      const bakPath = filePath + '.bak';

      await fs.writeFile(tmpPath, json, 'utf-8');
      await fs.rename(filePath, bakPath).catch(() => { });
      await fs.rename(tmpPath, filePath);
      console.log('Saved user repo');
    }
  }

  async findAll(): Promise<User[]> {
    await Promise.resolve();
    return structuredClone(this.users);
  }

  async findById(id: number): Promise<User | null> {
    await Promise.resolve();
    return structuredClone(this.users.find((user) => user.id == id)) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    await Promise.resolve();
    return (
      structuredClone(this.users.find((user) => user.username === username)) ??
      null
    );
  }

  async create(user: User): Promise<User | null> {
    await Promise.resolve();
    user.id = this.nextId++;
    this.users.push(user);
    return structuredClone(user);
  }

  async deleteById(id: number): Promise<void> {
    await Promise.resolve();
    this.users = this.users.filter((user) => user.id != id);
  }

  async updatePassword(id: number, password: string): Promise<void> {
    this.users[id].password = password;
    this.dirty = true;
  }
}
