import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Match, MatchRepository } from '../match.repository';
import { Mutex } from 'async-mutex';

interface MatchesFileData {
  matches: Match[];
}

@Injectable()
export class FileMatchRepository extends MatchRepository {
  private matches: Match[] = [];
  private mutex: Mutex = new Mutex();
  private dirty: boolean = false;

  constructor() {
    super();
    this.loadData().catch((err) => {
      console.error('Błąd podczas loadData:', err);
    });
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
    } catch (err) {
      console.error('Błąd wczytywania matches.json:', err);
      // jeśli plik nie istnieje — inicjuj puste dane
      this.matches = [];
    }
  }

  async saveData() {
    const data: MatchesFileData = {
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
    return this.matches;
  }

  async findById(id1: number, id2: number): Promise<Match | null> {
    await Promise.resolve();
    return (
      this.matches.find(
        (Match) => Match.bot_id1 == id1 && Match.bot_id2 == id2,
      ) || null
    );
  }

  async filterByBotIds(ids: number[]): Promise<Match[]> {
    await Promise.resolve();
    return this.matches.filter(
      (match) => ids.includes(match.bot_id1) || ids.includes(match.bot_id2),
    );
  }

  async create(match: Match): Promise<void> {
    await this.mutex.acquire();
    this.matches.push(match);
    this.dirty = true;
    this.mutex.release();
  }
}
