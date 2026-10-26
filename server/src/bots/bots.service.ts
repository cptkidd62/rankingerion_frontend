import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
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
import { MatchmakerService, NextMatchResult } from '@/matchmaker/matchmaker.service';
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
      const hash = createHash('sha256').update(file.buffer).digest('hex');
      if ((await this.botRepo.filterByUserId(user_id)).filter((bot) => bot.fileHash == hash).length > 0) {
        throw new BadRequestException('You\'ve already uploaded this file');
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
        fileHash: hash,
        status: { type: 'created', progress: 'in_progress', isDeleted: false },
        errorsCount: 0,
        lastErrorMsg: '',
        rating: initialRating,
      });
      return id;
    }
    else {
      throw new BotUploadException('Missing file');
    }
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
    let result: NextMatchResult;
    while ((result = await this.matchmakerService.getNextOpponent(id)).type != 'done') {
      if (result.type == 'no-more-opponents') {
        break;
      }
      if (result.type == 'wait') {
        await result.changed;
        continue;
      }
      let ids: number[] = result.opponentIds;
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
    await this.botRepo.updateStatusById(id, 'ok', 'no_more_opponents');
  }

  private async generateBenchmarkerMatches(
    id: number,
    user_id: number,
  ): Promise<void> {
    console.log('create with benchmarker');
    const activeMatches = new Set<Promise<boolean>>();
    let shouldStop = false;
    let checkFinish = false;
    while (true) {
      let result: NextMatchResult = await this.matchmakerService.getNextOpponent(id);
      switch (result.type) {
        case 'match': {
          let ids: number[] = result.opponentIds;
          const botIds = structuredClone(result.opponentIds);
          botIds.push(id);

          const task = this.processScheduledMatch(
            id, ids,
          ).then((shouldContinue) => {
            if (!shouldContinue) {
              shouldStop = true;
            }
            return shouldContinue;
          }).finally(() => {
            this.matchmakerService.removeFromCache(botIds);
          });

          activeMatches.add(task);

          void task.then(() => {
            activeMatches.delete(task);
          });
          break;
        }
        case 'wait': {
          await result.changed;
          break;
        }
        case 'no-more-opponents': {
          checkFinish = true;
          break;
        }
        case 'done': {
          checkFinish = true;
          break;
        }
      }
      if (shouldStop) {
        await Promise.all(activeMatches);
        return;
      }
      if (checkFinish) {
        await Promise.all(activeMatches);
        const bots = await this.botRepo.findAll();
        const this_bot = bots.find((b) => b.id == id)!;
        console.log('XXXXXX', this_bot.rating.matchesPlayed)
        if (result.type == 'no-more-opponents' || this_bot.rating.matchesPlayed >= this.appConfig.config.matchesToPlay) {
          await this.botRepo.updateStatusById(this_bot.id, 'ok', 'no_more_opponents');
          break;
        }
        checkFinish = false;
      }
    }
  }

  private async processScheduledMatch(
    id: number,
    opponentIds: number[]
  ): Promise<boolean> {
    const bots = await this.botRepo.findAll();
    const this_bot = bots.find((b) => b.id == id)!;
    const players = [bots[id]];
    const botIds = [id];
    const botNames = [bots[id].name];
    const userIds = [this_bot.user_id];
    const userNames = [bots[id].username];
    for (let i = 0; i < opponentIds.length; i++) {
      players.push(bots[opponentIds[i]]);
      const opp = bots[opponentIds[i]];
      botIds.push(opp.id);
      botNames.push(opp.name);
      userIds.push(opp.user_id);
      userNames.push(opp.username);
    }
    try {
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
            await this.botRepo.updateStatusById(player.id, 'compilation_error', 'failed');
            await this.botRepo.updateErrorLogById(player.id, res.message, true);
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
              return false;
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
            await this.botRepo.updateStatusById(player.id, 'playtime_error', 'failed');
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
              return false;
            }
          }
        } else if (res instanceof ConnectionError) {
          console.error('ConnectionError');
          return false;
        } else {
          console.error('PlayTaskError');
        }
        return true;
      }
      if (this_bot.status.isDeleted) {
        return false;
      }
      if (players.some((bot) => bot.status.isDeleted)) {
        return true;
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
        }
        catch (err) {
          console.error(err);
        }
      }
      catch (err) {
        console.error('Error during create match:', err);
      }
      await Promise.all(players.map(async (bot, i) => {
        if (scores[i] == -1)
          await this.botRepo.updateErrorLogById(bot.id, res.logs[i]);
        await this.botRepo.updateStatusTypeById(bot.id, 'ok');
      }));
    }
    finally { }
    return true;
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
