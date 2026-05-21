import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Match, MatchRepository } from '../match.repository';
import { Mutex } from 'async-mutex';

interface MatchesFileData {
  next_id: number;
  matches: Match[];
}

@Injectable()
export class FileMatchRepository
  extends MatchRepository
  implements OnModuleInit
{
  private matches: Match[] = [];
  private nextId = 0;
  private mutex: Mutex = new Mutex();
  private dirty: boolean = false;

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.loadData();
  }

  private async loadData() {
    const dataDir = process.env.DATA_DIR ?? './';
    const fileName = process.env.MATCHES_FILE ?? 'matches.json';
    const filePath = path.join(dataDir, fileName);
    console.log(filePath);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data: MatchesFileData = JSON.parse(raw) as MatchesFileData;
      this.matches = data.matches;
      this.nextId = data.next_id;
    } catch (err) {
      console.error('Błąd wczytywania matches.json:', err);
      // jeśli plik nie istnieje — inicjuj puste dane
      this.matches = [];
    }
  }

  async saveData() {
    const data: MatchesFileData = {
      next_id: this.nextId,
      matches: this.matches,
    };
    if (this.dirty) {
      await this.mutex.acquire();
      const json = JSON.stringify(data, null, 2);
      this.dirty = false;
      this.mutex.release();

      const dataDir = process.env.DATA_DIR ?? './';
      const fileName = process.env.MATCHES_FILE ?? 'matches.json';
      const filePath = path.join(dataDir, fileName);
      const tmpPath = filePath + '.tmp';
      const bakPath = filePath + '.bak';

      await fs.writeFile(tmpPath, json, 'utf-8');
      await fs.rename(filePath, bakPath).catch(() => {});
      await fs.rename(tmpPath, filePath);
      console.log('Zapisano match repo');
    }
  }

  async findAll(): Promise<Match[]> {
    await Promise.resolve();
    return structuredClone(this.matches);
  }

  async findById(id1: number, id2: number): Promise<Match | null> {
    await Promise.resolve();
    return (
      structuredClone(
        this.matches.find(
          (Match) => Match.bot_ids[0] == id1 && Match.bot_ids[1] == id2,
        ),
      ) ?? null
    );
  }

  async filterByBotIds(ids: number[]): Promise<Match[]> {
    await Promise.resolve();
    return structuredClone(
      this.matches.filter((match) =>
        match.bot_ids.some((id) => ids.includes(id)),
      ),
    );
  }

  async create(match: Match): Promise<number> {
    await this.mutex.acquire();
    match.id = this.nextId++;
    this.matches.push(match);
    this.dirty = true;
    this.mutex.release();
    return match.id;
  }
}
