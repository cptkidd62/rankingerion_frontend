import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { BotRepository, Bot, BotDTO, BotFileData } from 'src/data/bot.repository';
import { MatchRepository } from 'src/data/match.repository';
import { UserRepository } from 'src/data/user.repository';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BenchmarkerService } from 'src/benchmarker/benchmarker.service';
import { initialRating, RatingService } from 'src/data/rating.service';
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

  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
    private readonly userRepo: UserRepository,
    private readonly benchmarkerService: BenchmarkerService,
    private readonly ratingService: RatingService,
    private readonly appConfig: AppConfigService,
    private readonly matchmakerService: MatchmakerService,
  ) { }

  async findAll(): Promise<BotDTO[]> {
    return (await this.botRepo.findAll()).map((bot) => {
      const { filename: _, ...dto } = bot;
      return dto;
    });
  }

  async findById(id: number): Promise<BotDTO | null> {
    const bot = await this.botRepo.findById(id);
    if (bot == null) return null;
    const { filename: _, ...dto } = bot;
    return dto;
  }

  async filterByUserId(id: number): Promise<BotDTO[]> {
    return (await this.botRepo.filterByUserId(id)).map((bot) => {
      const { filename: _, ...dto } = bot;
      return dto;
    });
  }

  async create(
    name: string,
    file: Express.Multer.File,
    user_id: number,
  ): Promise<number> {
    if ((await this.botRepo.filterByUserId(user_id)).filter((bot) => bot.status.type != 'deleted').length >= this.appConfig.config.maxBotsPerUser) {
      throw new BadRequestException('Reached max active bot number, delete any bot first');
    }
    const ext = this.getExtention(file.originalname);
    if (ext === '') {
      throw new BotUploadException('Missing file extention');
    }
    if (!this.validateExtention(ext)) {
      throw new BotUploadException('Unsupported file extention');
    }
    const user = await this.userRepo.findById(user_id);
    if (user === null) {
      throw new BadRequestException('User not found');
    }
    if (!(await this.botNameUnique(name, user_id))) {
      throw new BadRequestException(
        'You already use this bot name (checks deleted too)',
      );
    }
    const uuid = crypto.randomUUID();
    const filePath = this.makeBotFullPath(uuid + ext);
    await fs.writeFile(filePath, file.buffer, 'utf-8');
    const id = await this.botRepo.create({
      id: 0,
      name: name,
      language: ext,
      user_id: user_id,
      username: user.username,
      filename: uuid,
      status: { type: 'created' },
      rating: initialRating,
    });
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
        (matchid) => {
          match.id = matchid;
          this.ratingService
            .processMatch(match)
            .then(() => this.matchmakerService.removeFromCache(bot.id, id))
            .catch((err) => {
              console.error(err);
              this.matchmakerService.removeFromCache(bot.id, id);
            });
        },
        (err) => {
          this.matchmakerService.removeFromCache(bot.id, id);
          console.error('Error during create match:', err);
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
              username: player.username,
              filename: player.filename,
              status: { type: 'compilation_error' },
              rating: player.rating,
            });
            if (player.id === this_bot.id) {
              // don't continue if own bot has error
              this.matchmakerService.removeFromCache(bot.id, id);
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
              username: player.username,
              filename: player.filename,
              status: { type: 'playtime_error' },
              rating: player.rating,
            });
            if (player.id === this_bot.id) {
              // don't continue if own bot has error
              this.matchmakerService.removeFromCache(bot.id, id);
              return;
            }
          }
        } else {
          console.error('PlayTaskError');
          this.matchmakerService.removeFromCache(bot.id, id);
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
        (matchid) => {
          match.id = matchid;
          this.ratingService
            .processMatch(match)
            .then(() => this.matchmakerService.removeFromCache(bot.id, id))
            .catch((err) => {
              console.error(err);
              this.matchmakerService.removeFromCache(bot.id, id);
            });
        },
        (err) => {
          this.matchmakerService.removeFromCache(bot.id, id);
          console.error('Error during create match:', err);
        },
      );
      await this.botRepo.updateById(bot.id, {
        id: bot.id,
        name: bot.name,
        language: bot.language,
        user_id: bot.user_id,
        username: bot.username,
        filename: bot.filename,
        status: { type: 'ok' },
        rating: bot.rating,
      });
    }
    await this.botRepo.updateById(this_bot.id, {
      id: this_bot.id,
      name: this_bot.name,
      language: this_bot.language,
      user_id: this_bot.user_id,
      username: this_bot.username,
      filename: this_bot.filename,
      status: { type: 'ok' },
      rating: this_bot.rating,
    });
  }

  async getFile(botId: number): Promise<BotFileData> {
    const bot = await this.botRepo.findById(botId);
    if (bot == null) throw new BadRequestException('Bot ID invalid');
    const contents = await fs.readFile(this.makeBotFullPath(this.botFile(bot)));
    const mimeType =
      {
        '.cpp': 'text/plain',
      }[bot.language] ?? 'application/octet-stream';
    const filename = bot.name + bot.language;
    return {
      filename,
      mimeType,
      contents
    };
  }

  private botFile(bot: Bot): string {
    return bot.filename + bot.language;
  }

  private makeBotFullPath(filename: string): string {
    return path.join(this.appConfig.config.botsDir, filename);
  }

  async deleteById(id: number): Promise<void> {
    return this.botRepo.deleteById(id);
  }

  async updateNameById(id: number, name: string, userId: number): Promise<void> {
    if (!(await this.botNameUnique(name, userId))) {
      throw new BadRequestException('Name already used');
    }
    if (name == '') {
      throw new BadRequestException('Name cannot be empty');
    }
    return this.botRepo.updateNameById(id, name);
  }

  private getExtention(filepath: string): string {
    return path.extname(filepath);
  }

  private validateExtention(extention: string): boolean {
    return this.appConfig.config.acceptedExtentions.includes(extention);
  }

  private async botNameUnique(name: string, userId: number): Promise<boolean> {
    const bots = await this.botRepo.filterByUserId(userId);
    return bots.find((bot) => bot.name == name) == undefined;
  }
}
