import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Bot, BotRepository } from '../bot.repository';
import { Mutex } from 'async-mutex';

interface BotFileData {
  next_id: number;
  bots: Bot[];
}

@Injectable()
export class FileBotRepository extends BotRepository {
  private bots: Bot[] = [];
  private nextId = 0;
  private mutex: Mutex = new Mutex();
  private dirty: boolean = false;

  constructor() {
    super();
    this.loadData().catch((err) => {
      console.error('Błąd podczas loadData:', err);
    });
  }

  private async loadData() {
    console.log('typeof path:', typeof path); // powinna być 'object'
    console.log('path === undefined:', path === undefined);
    const dataDir = process.env.DATA_DIR ?? './';
    const fileName = process.env.BOTS_FILE ?? 'bots.json';
    const filePath = path.join(dataDir, fileName);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data: BotFileData = JSON.parse(raw) as BotFileData;
      this.bots = data.bots;
      this.nextId = data.next_id;
    } catch (err) {
      console.error('Błąd wczytywania bots.json:', err);
      // jeśli plik nie istnieje — inicjuj puste dane
      this.bots = [];
      this.nextId = 0;
    }
  }

  async saveData() {
    const data: BotFileData = {
      next_id: this.nextId,
      bots: this.bots,
    };
    if (this.dirty) {
      await this.mutex.acquire();
      const json = JSON.stringify(data, null, 2);
      this.dirty = false;
      this.mutex.release();

      const dataDir = process.env.DATA_DIR ?? './';
      const fileName = process.env.BOTS_FILE ?? 'bots.json';
      const filePath = path.join(dataDir, fileName);
      const tmpPath = filePath + '.tmp';
      const bakPath = filePath + '.bak';

      await fs.writeFile(tmpPath, json, 'utf-8');
      await fs.rename(filePath, bakPath).catch(() => {});
      await fs.rename(tmpPath, filePath);
      console.log('Zapisano bot repo');
    }
  }

  async findAll(): Promise<Bot[]> {
    await Promise.resolve();
    return this.bots;
  }

  async findById(id: number): Promise<Bot | null> {
    await Promise.resolve();
    return this.bots.find((Bot) => Bot.id == id) ?? null;
  }

  async filterByUserId(id: number): Promise<Bot[]> {
    await Promise.resolve();
    return this.bots.filter((Bot) => Bot.user_id == id);
  }

  async create(bot: Bot): Promise<number> {
    await this.mutex.acquire();
    bot.id = this.nextId++;
    this.bots.push(bot);
    this.dirty = true;
    this.mutex.release();
    return bot.id;
  }

  async deleteById(id: number): Promise<void> {
    await this.mutex.acquire();
    this.bots = this.bots.filter((bot) => bot.id != id);
    this.dirty = true;
    this.mutex.release();
  }
}
