import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Bot, BotRepository, RatingData } from '../bot.repository';
import { Mutex } from 'async-mutex';
import { initialRating } from '../rating.service';
import { AppConfigService } from 'src/config/appconfig.service';

interface BotFileData {
  next_id: number;
  bots: Bot[];
}

@Injectable()
export class FileBotRepository extends BotRepository implements OnModuleInit {
  private bots: Bot[] = [];
  private nextId = 0;
  private mutex: Mutex = new Mutex();
  private dirty: boolean = false;

  constructor(private readonly appConfig: AppConfigService) {
    super();
  }

  async onModuleInit() {
    await this.loadData();
  }

  private async loadData() {
    console.log('typeof path:', typeof path); // powinna być 'object'
    console.log('path === undefined:', path === undefined);
    const dataDir = this.appConfig.config.dataDir;
    const fileName = this.appConfig.config.botsFile;
    const filePath = path.join(dataDir, fileName);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data: BotFileData = JSON.parse(raw) as BotFileData;
      this.bots = data.bots;
      // set ratings to initial values for purpose of recaltulating rating on server restart
      for (const bot of this.bots) {
        bot.rating = initialRating;
        if (bot.status.type == 'compilation_error' || bot.status.type == 'playtime_error') {
          bot.rating.value = 0;
        }
      }
      this.nextId = data.next_id;
    } catch (err) {
      console.error('Error reading bots.json:', err);
      // initialize empty data if file does not exist
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
      this.mutex.release();

      const dataDir = this.appConfig.config.dataDir;
      const fileName = this.appConfig.config.botsFile;
      const filePath = path.join(dataDir, fileName);
      const tmpPath = filePath + '.tmp';
      const bakPath = filePath + '.bak';

      await fs.writeFile(tmpPath, json, 'utf-8');
      await fs.rename(filePath, bakPath).catch(() => { });
      await fs.rename(tmpPath, filePath);
      console.log('Saved bot repo');
    }
  }

  async findAll(): Promise<Bot[]> {
    await Promise.resolve();
    return structuredClone(this.bots);
  }

  async findById(id: number): Promise<Bot | null> {
    await Promise.resolve();
    return structuredClone(this.bots.find((Bot) => Bot.id == id)) ?? null;
  }

  async filterByUserId(id: number): Promise<Bot[]> {
    await Promise.resolve();
    return structuredClone(this.bots.filter((Bot) => Bot.user_id == id));
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
    const idx = this.bots.findIndex((bot) => bot.id == id);
    if (idx >= 0 && !this.bots[idx].status.isDeleted) {
      this.bots[idx].status = { type: this.bots[idx].status.type, progress: 'failed', isDeleted: true };
      this.dirty = true;
    }
    this.mutex.release();
  }

  async updateById(id: number, bot: Bot): Promise<void> {
    await this.mutex.acquire();
    const idx = this.bots.findIndex((bot) => bot.id == id);
    if (idx >= 0 && !this.bots[idx].status.isDeleted) {
      const rating = this.bots[idx].rating;
      this.bots[idx] = bot;
      this.bots[idx].rating = rating;
      this.dirty = true;
    }
    this.mutex.release();
  }

  async updateNameById(id: number, name: string): Promise<void> {
    await this.mutex.acquire();
    const idx = this.bots.findIndex((bot) => bot.id == id);
    if (idx >= 0) {
      this.bots[idx].name = name;
      this.dirty = true;
    }
    this.mutex.release();
  }

  async updateRatingById(id: number, rating: RatingData): Promise<void> {
    await this.mutex.acquire();
    const idx = this.bots.findIndex((bot) => bot.id == id);
    if (idx >= 0) {
      this.bots[idx].rating = rating;
      this.dirty = true;
    }
    this.mutex.release();
  }
}
