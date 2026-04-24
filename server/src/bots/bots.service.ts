import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { BotRepository, Bot } from 'src/data/bot.repository';
import { MatchRepository } from 'src/data/match.repository';
import { UserRepository } from 'src/data/user.repository';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BenchmarkerService } from 'src/benchmarker/benchmarker.service';
import { BotUploadException } from 'src/errors/BotUploadExceptions';

@Injectable()
export class BotsService {
  private acceptedExtentions: string[] = ['.cpp', '.exe'];

  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
    private readonly userRepo: UserRepository,
    private readonly benchmarkerService: BenchmarkerService,
  ) {}

  async findAll(): Promise<Bot[]> {
    return this.botRepo.findAll();
  }

  async findById(id: number): Promise<Bot | null> {
    return this.botRepo.findById(id);
  }

  async filterByUserId(id: number): Promise<Bot[]> {
    return this.botRepo.filterByUserId(id);
  }

  async create(
    name: string,
    file: Express.Multer.File,
    user_id: number,
  ): Promise<number> {
    const ext = this.getExtention(file.originalname);
    if (ext === '') {
      throw new BotUploadException('Brak rozszerzenia pliku');
    }
    if (!this.validateExtention(ext)) {
      throw new BotUploadException('Nieobsługiwane rozszerzenie pliku');
    }
    const id = await this.botRepo.create({
      id: 0,
      name: name,
      language: ext,
      user_id: user_id,
    });
    const filePath = path.join(process.env.BOTS_DIR ?? './', id + '_bot' + ext);
    await fs.writeFile(filePath, file.buffer, 'utf-8');
    return id;
  }

  async createWithMatches(
    name: string,
    file: Express.Multer.File,
    user_id: number,
  ): Promise<number> {
    const id = await this.create(name, file, user_id);

    if (id === undefined) {
      return id;
    }
    if (process.env.USE_BENCHMARKER == 'true') {
      await this.generateBenchmarkerMatches(name, id, user_id);
    } else {
      await this.generateMockMatches(name, id, user_id);
    }
    return id;
  }

  private async generateMockMatches(
    name: string,
    id: number,
    user_id: number,
  ): Promise<void> {
    console.log('create with mock');

    const bots = await this.botRepo.findAll();
    const users = await this.userRepo.findAll();
    const this_user = users.find((u) => u.id == user_id) ?? {
      id: -1,
      username: 'undefined',
      password: '',
    };
    bots.forEach((bot) => {
      if (bot.user_id != user_id) {
        const user = users.find((u) => u.id == bot.user_id) ?? {
          id: -1,
          username: 'undefined',
          password: '',
        };
        this.matchRepo
          .create({
            bot_ids: [bot.id, id],
            botnames: [bot.name, name],
            user_ids: [user.id, user_id],
            usernames: [user.username, this_user.username],
            scores: [[randomInt(0, 1000), randomInt(0, 1000)]],
          })
          .catch((err) => {
            console.error('Błąd podczas create match:', err);
          });
      }
    });
  }

  private async generateBenchmarkerMatches(
    name: string,
    id: number,
    user_id: number,
  ): Promise<void> {
    console.log('create with benchmarker');

    const bots = await this.botRepo.findAll();
    const users = await this.userRepo.findAll();
    const this_user = users.find((u) => u.id == user_id) ?? {
      id: -1,
      username: 'undefined',
      password: '',
    };
    const this_bot = bots.find((b) => b.id == id)!;
    for (const bot of bots) {
      if (bot.user_id != user_id) {
        const user = users.find((u) => u.id == bot.user_id) ?? {
          id: -1,
          username: 'undefined',
          password: '',
        };
        const res = await this.benchmarkerService.playSingle([
          this.botFile(bot),
          this.botFile(this_bot),
        ]);
        if (res?.summaries != '') {
          console.error(res?.summaries);
          return;
        }
        const scores = res.scores;
        this.matchRepo
          .create({
            bot_ids: [bot.id, id],
            botnames: [bot.name, name],
            user_ids: [user.id, user_id],
            usernames: [user.username, this_user.username],
            scores: [scores],
          })
          .catch((err) => {
            console.error('Błąd podczas create match:', err);
          });
      }
    }
  }

  private botFile(bot: Bot): string {
    return String(bot.id) + '_singlescore' + bot.language;
  }

  async deleteById(id: number): Promise<void> {
    return this.botRepo.deleteById(id);
  }

  private getExtention(filepath: string): string {
    return path.extname(filepath);
  }

  private validateExtention(extention: string): boolean {
    return this.acceptedExtentions.includes(extention);
  }
}
