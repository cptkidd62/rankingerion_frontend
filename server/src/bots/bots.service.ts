import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { BotRepository, Bot } from 'src/data/bot.repository';
import { MatchRepository } from 'src/data/match.repository';
import { UserRepository } from 'src/data/user.repository';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BenchmarkerService } from 'src/benchmarker/benchmarker.service';
import { BotUploadException } from 'src/errors/BotUploadExceptions';
import {
  CompilationError,
  PlayTaskError,
  PlaytimeError,
} from 'src/errors/PlayErrors';

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
      status: { type: 'created' },
    });
    const filePath = path.join(
      process.env.BOTS_DIR ?? './',
      id + '_singlescore' + ext,
    );
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
      this.generateBenchmarkerMatches(name, id, user_id).catch((error) => {
        console.error(error);
      });
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
      // allow only other users' bots
      if (bot.user_id != user_id) {
        // don't allow bots with errors
        if (bot.status.type === 'created' || bot.status.type === 'ok') {
          const user = users.find((u) => u.id == bot.user_id) ?? {
            id: -1,
            username: 'undefined',
            password: '',
          };
          const players = [bot, this_bot];
          const res = await this.benchmarkerService.playSingle(
            players.map((player) => this.botFile(player)),
          );
          if (res instanceof PlayTaskError) {
            if (res instanceof CompilationError) {
              console.error(
                'compilation error of bot %s on index %d',
                res.agentName,
                res.agentIndex,
              );
              const player = players.at(res.agentIndex!);
              if (player) {
                await this.botRepo.updateById(player.id, {
                  id: player.id,
                  name: player.name,
                  language: player.language,
                  user_id: player.user_id,
                  status: { type: 'compilation_error' },
                });
              }
            } else if (res instanceof PlaytimeError) {
              console.error(
                'playtime error of bot %s on index %d: %s',
                res.agentName,
                res.agentIndex,
                res.message,
              );
              const player = players.at(res.agentIndex!);
              if (player) {
                await this.botRepo.updateById(player.id, {
                  id: player.id,
                  name: player.name,
                  language: player.language,
                  user_id: player.user_id,
                  status: { type: 'playtime_error' },
                });
              }
            } else {
              console.error('PlayTaskError');
            }
            continue;
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
