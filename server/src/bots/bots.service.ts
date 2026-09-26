import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { BotRepository, Bot, BotDTO, BotFileData } from '@/data/bot.repository';
import { MatchRepository } from '@/data/match.repository';
import { UserRepository } from '@/data/user.repository';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BenchmarkerService } from '@/benchmarker/benchmarker.service';
import { initialRating, RatingService } from '@/data/rating.service';
import { BotUploadException } from '@/errors/BotUploadExceptions';
import {
  CompilationError,
  ConnectionError,
  PlayTaskError,
  PlaytimeError,
} from '@/errors/PlayErrors';
import { AppConfigService } from '@/config/appconfig.service';
import { MatchmakerService } from '@/matchmaker/matchmaker.service';
import { OnEvent } from '@nestjs/event-emitter';

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
    language: string,
    code: string,
    user_id: number,
  ): Promise<number> {
    if ((await this.botRepo.filterByUserId(user_id)).filter((bot) => !bot.status.isDeleted).length >= this.appConfig.config.maxBotsPerUser) {
      throw new BadRequestException('Reached max active bot number, delete any bot first');
    }
    if (file != undefined) {
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
        dateCreated: Date.now(),
        filename: uuid,
        status: { type: 'created', progress: 'in_progress', isDeleted: false },
        errorsCount: 0,
        lastErrorMsg: '',
        rating: initialRating,
      });
      return id;
    }
    else {
      const ext = language;
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
      if (code == '') {
        throw new BadRequestException('Code cannot be empty');
      }
      const uuid = crypto.randomUUID();
      const filePath = this.makeBotFullPath(uuid + ext);
      await fs.writeFile(filePath, code, 'utf-8');
      const id = await this.botRepo.create({
        id: 0,
        name: name,
        language: ext,
        user_id: user_id,
        username: user.username,
        dateCreated: Date.now(),
        filename: uuid,
        status: { type: 'created', progress: 'in_progress', isDeleted: false },
        errorsCount: 0,
        lastErrorMsg: '',
        rating: initialRating,
      });
      return id;
    }
  }

  async createWithMatches(
    name: string,
    file: Express.Multer.File,
    language: string,
    code: string,
    user_id: number,
  ): Promise<number> {
    const id = await this.create(name, file, language, code, user_id);

    if (id === undefined) {
      return id;
    }
    if (this.appConfig.config.useBenchmarker) {
      this.generateBenchmarkerMatches(id, user_id).catch((error) => {
        console.error(error);
      });
    } else {
      await this.generateMockMatches(id, user_id);
    }
    return id;
  }

  private async generateMockMatches(
    id: number,
    user_id: number,
  ): Promise<void> {

    const bots = await this.botRepo.findAll();
    let ids: number[] | null;
    while ((ids = await this.matchmakerService.getNextOpponent(id)) != null) {
      const players = [bots[id]];
      const scores: number[] = [randomInt(0, 1000)];
      const botIds = [id];
      const botNames = [bots[id].name];
      const userIds = [user_id];
      const userNames = [bots[id].username];
      for (let i = 0; i < ids.length; i++) {
        players.push(bots[ids[i]]);
        scores.push(randomInt(0, 1000));
        const opp = bots[ids[i]];
        botIds.push(opp.id);
        botNames.push(opp.name);
        userIds.push(opp.user_id);
        userNames.push(opp.username);
      }
      const match = {
        id: -1,
        bot_ids: botIds,
        botnames: botNames,
        user_ids: userIds,
        usernames: userNames,
        score: scores,
        sequence_number: -1,
      };
      try {
        const matchid = await this.matchRepo.create(match);
        match.id = matchid;
        try {
          await this.ratingService.processMatch(match);
          this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        }
        catch (err) {
          console.error(err);
          this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        }
      }
      catch (err) {
        this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        console.error('Error during create match:', err);
      }
    }
    await this.botRepo.updateById(bots[id].id, {
      id: bots[id].id,
      name: bots[id].name,
      language: bots[id].language,
      user_id: bots[id].user_id,
      username: bots[id].username,
      dateCreated: bots[id].dateCreated,
      filename: bots[id].filename,
      status: { type: 'ok', progress: 'no_more_opponents', isDeleted: false },
      errorsCount: bots[id].errorsCount,
      lastErrorMsg: bots[id].lastErrorMsg,
      rating: bots[id].rating,
    });
  }

  private async generateBenchmarkerMatches(
    id: number,
    user_id: number,
  ): Promise<void> {
    console.log('create with benchmarker');

    const bots = await this.botRepo.findAll();
    const users = await this.userRepo.findAll();
    const this_bot = bots.find((b) => b.id == id)!;
    let ids: number[] | null;
    while ((ids = await this.matchmakerService.getNextOpponent(id)) != null) {
      const players = [bots[id]];
      const botIds = [id];
      const botNames = [bots[id].name];
      const userIds = [user_id];
      const userNames = [bots[id].username];
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
              dateCreated: player.dateCreated,
              filename: player.filename,
              status: { type: 'compilation_error', progress: 'failed', isDeleted: false },
              errorsCount: player.errorsCount,
              lastErrorMsg: player.lastErrorMsg,
              rating: player.rating,
            });
            await this.botRepo.updateRatingById(player.id, {
              value: 0,
              RD: player.rating.RD,
              lastMatchId: player.rating.lastMatchId,
              matchesPlayed: player.rating.matchesPlayed,
              opponentsPlayed: player.rating.opponentsPlayed,
              trueSkillMu: player.rating.trueSkillMu,
              trueSkillSigma: player.rating.trueSkillSigma,
            });
            if (player.id === this_bot.id) {
              // don't continue if own bot has error
              this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
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
              dateCreated: player.dateCreated,
              filename: player.filename,
              status: { type: 'playtime_error', progress: 'failed', isDeleted: false },
              errorsCount: player.errorsCount,
              lastErrorMsg: player.lastErrorMsg,
              rating: player.rating,
            });
            await this.botRepo.updateRatingById(player.id, {
              value: 0,
              RD: player.rating.RD,
              lastMatchId: player.rating.lastMatchId,
              matchesPlayed: player.rating.matchesPlayed,
              opponentsPlayed: player.rating.opponentsPlayed,
              trueSkillMu: player.rating.trueSkillMu,
              trueSkillSigma: player.rating.trueSkillSigma,
            });
            if (player.id === this_bot.id) {
              // don't continue if own bot has error
              this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
              return;
            }
          }
        } else if (res instanceof ConnectionError) {
          console.error('ConnectionError');
          this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
          return;
        } else {
          console.error('PlayTaskError');
          this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        }
        continue;
      }
      if (this_bot.status.isDeleted) {
        this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        return;
      }
      if (players.some((bot) => bot.status.isDeleted)) {
        this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        continue;
      }
      const scores = res.scores;
      const match = {
        id: -1,
        bot_ids: botIds,
        botnames: botNames,
        user_ids: userIds,
        usernames: userNames,
        score: scores,
        sequence_number: -1,
      };
      try {
        const matchid = await this.matchRepo.create(match);
        match.id = matchid;
        try {
          await this.ratingService.processMatch(match);
          this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        }
        catch (err) {
          console.error(err);
          this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        }
      }
      catch (err) {
        this.matchmakerService.removeFromCache(players.map((bot) => bot.id));
        console.error('Error during create match:', err);
      }
      players.forEach(async (bot) => {
        await this.botRepo.updateById(bot.id, {
          id: bot.id,
          name: bot.name,
          language: bot.language,
          user_id: bot.user_id,
          username: bot.username,
          dateCreated: bot.dateCreated,
          filename: bot.filename,
          status: { type: 'ok', progress: bot.status.progress, isDeleted: false },
          errorsCount: bot.errorsCount += (scores[0] == -1 ? 1 : 0),
          lastErrorMsg: scores[0] == -1 ? res.logs[0] : bot.lastErrorMsg,
          rating: bot.rating,
        });
      })
    }
    await this.botRepo.updateById(this_bot.id, {
      id: this_bot.id,
      name: this_bot.name,
      language: this_bot.language,
      user_id: this_bot.user_id,
      username: this_bot.username,
      dateCreated: this_bot.dateCreated,
      filename: this_bot.filename,
      status: { type: 'ok', progress: 'no_more_opponents', isDeleted: false },
      errorsCount: this_bot.errorsCount,
      lastErrorMsg: this_bot.lastErrorMsg,
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
    return this.appConfig.config.acceptedTextExtentions.includes(extention) || this.appConfig.config.acceptedBinExtentions.includes(extention);
  }

  private async botNameUnique(name: string, userId: number): Promise<boolean> {
    const bots = await this.botRepo.filterByUserId(userId);
    return bots.find((bot) => bot.name == name) == undefined;
  }

  private async restartBenchmarkerGeneration() {
    const bots = await this.botRepo.findAll();
    for (const bot of bots) {
      if (bot.status.progress == 'in_progress') {
        this.generateBenchmarkerMatches(bot.id, bot.user_id);
      }
    }
  }

  @OnEvent('client_connected')
  private handleClientConnectedEvent() {
    if (this.appConfig.config.useBenchmarker) {
      this.restartBenchmarkerGeneration()
    }
  }
}
