import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { BotRepository, Bot } from 'src/data/bot.repository';
import { MatchRepository } from 'src/data/match.repository';
import { UserRepository } from 'src/data/user.repository';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BenchmarkerService } from 'src/benchmarker/benchmarker.service';
import { createInitialRatings, RatingService } from 'src/data/rating.service';
import { BotUploadException } from 'src/errors/BotUploadExceptions';
import {
  CompilationError,
  PlayTaskError,
  PlaytimeError,
} from 'src/errors/PlayErrors';
import { AppConfigService } from 'src/config/appconfig.service';
import { MatchmakerService } from 'src/matchmaker/matchmaker.service';

@Injectable()
export class BotsService {
  private acceptedExtentions: string[] = ['.cpp', '.exe'];

  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
    private readonly userRepo: UserRepository,
    private readonly benchmarkerService: BenchmarkerService,
    private readonly ratingService: RatingService,
    private readonly appConfig: AppConfigService,
    private readonly matchmakerService: MatchmakerService,
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
      rating: createInitialRatings(),
    });
    const filePath = path.join(
      this.appConfig.config.botsDir,
      id + this.appConfig.config.botName + ext,
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
    if (this.appConfig.config.useBenchmarker) {
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
    let i: number | null;
    while ((i = await this.matchmakerService.getNextOpponent(id)) != null) {
      const bot = bots[i];
      const user = users.find((u) => u.id == bot.user_id) ?? {
        id: -1,
        username: 'undefined',
        password: '',
      };
      const scores = [randomInt(0, 1000), randomInt(0, 1000)];
      const results =
        scores[0] > scores[1]
          ? [1, -1]
          : scores[0] < scores[1]
            ? [-1, 1]
            : [0, 0];
      const match = {
        id: -1,
        bot_ids: [bot.id, id],
        botnames: [bot.name, name],
        user_ids: [user.id, user_id],
        usernames: [user.username, this_user.username],
        score: results,
        sequence_number: -1,
      };
      this.matchRepo.create(match).then(
        (id) => {
          match.id = id;
          this.ratingService
            .processMatch(match)
            .catch((err) => console.error(err));
        },
        (err) => {
          console.error('Błąd podczas create match:', err);
        },
      );
    }
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
    let i: number | null;
    while ((i = await this.matchmakerService.getNextOpponent(id)) != null) {
      const bot = bots[i];
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
              rating: player.rating,
            });
            if (player.id === this_bot.id) {
              // don't continue if own bot has error
              return;
            }
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
              rating: player.rating,
            });
            if (player.id === this_bot.id) {
              // don't continue if own bot has error
              return;
            }
          }
        } else {
          console.error('PlayTaskError');
        }
        continue;
      }
      const scores = res.scores;
      const results =
        scores[0] > scores[1]
          ? [1, -1]
          : scores[0] < scores[1]
            ? [-1, 1]
            : [0, 0];
      const match = {
        id: -1,
        bot_ids: [bot.id, id],
        botnames: [bot.name, name],
        user_ids: [user.id, user_id],
        usernames: [user.username, this_user.username],
        score: results,
        sequence_number: -1,
      };
      this.matchRepo.create(match).then(
        (id) => {
          match.id = id;
          this.ratingService
            .processMatch(match)
            .catch((err) => console.error(err));
        },
        (err) => {
          console.error('Błąd podczas create match:', err);
        },
      );
      await this.botRepo.updateById(bot.id, {
        id: bot.id,
        name: bot.name,
        language: bot.language,
        user_id: bot.user_id,
        status: { type: 'ok' },
        rating: bot.rating,
      });
    }
    await this.botRepo.updateById(this_bot.id, {
      id: this_bot.id,
      name: this_bot.name,
      language: this_bot.language,
      user_id: this_bot.user_id,
      status: { type: 'ok' },
      rating: this_bot.rating,
    });
  }

  private botFile(bot: Bot): string {
    return String(bot.id) + this.appConfig.config.botName + bot.language;
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
