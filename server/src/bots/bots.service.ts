import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { BotRepository, Bot } from 'src/data/bot.repository';
import { MatchRepository } from 'src/data/match.repository';
import { UserRepository } from 'src/data/user.repository';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class BotsService {
  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
    private readonly userRepo: UserRepository,
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
    language: string,
    code: string,
    user_id: number,
  ): Promise<void> {
    const id = await this.botRepo.create({
      id: 0,
      name: name,
      language: language,
      user_id: user_id,
    });

    const filePath = path.join(
      process.env.BOTS_DIR ?? './',
      id + '_bot.' + language,
    );
    await fs.writeFile(filePath, code, 'utf-8');
  }

  async createWithMockMatches(
    name: string,
    language: string,
    code: string,
    user_id: number,
  ): Promise<void> {
    const id = await this.botRepo.create({
      id: 0,
      name: name,
      language: language,
      user_id: user_id,
    });

    const filePath = path.join(
      process.env.BOTS_DIR ?? './',
      id + '_bot.' + language,
    );
    await fs.writeFile(filePath, code, 'utf-8');

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
            bot_id1: bot.id,
            botname1: bot.name,
            user_id1: user.id,
            username1: user.username,
            bot_id2: id,
            botname2: name,
            user_id2: user_id,
            username2: this_user.username,
            scores: [[randomInt(0, 1000), randomInt(0, 1000)]],
          })
          .catch((err) => {
            console.error('Błąd podczas create match:', err);
          });
      }
    });
  }

  async deleteById(id: number): Promise<void> {
    return this.botRepo.deleteById(id);
  }
}
