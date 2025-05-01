import { Injectable } from '@nestjs/common';
import { BotRepository } from 'src/data/bot.repository';
import { MatchRepository, Match, MatchFull } from 'src/data/match.repository';

@Injectable()
export class MatchesService {
  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
  ) {}

  async findAll(): Promise<MatchFull[]> {
    const matches = await this.matchRepo.findAll();
    const bots = await this.botRepo.findAll();
    const matchesfull = matches.map((match) => {
      const m = match as MatchFull;
      m.bot1name = bots.find((bot) => bot.id == m.bot1id)?.name || 'empty';
      m.bot2name = bots.find((bot) => bot.id == m.bot2id)?.name || 'empty';
      return m;
    });
    return matchesfull;
  }

  async findById(id: number): Promise<Match | null> {
    return this.matchRepo.findById(id);
  }

  async filterByBotIds(ids: number[]): Promise<Match[]> {
    return this.matchRepo.filterByBotIds(ids);
  }

  async filterByUserId(id: number): Promise<Match[]> {
    const bots = await this.botRepo.filterByUserId(id);
    const botsIds = bots.map((bot) => bot.id);
    return this.matchRepo.filterByBotIds(botsIds);
  }

  async create(
    bot1id: number,
    bot2id: number,
    score1: number,
    score2: number,
  ): Promise<void> {
    return this.matchRepo.create({
      id: 0,
      bot1id: bot1id,
      bot2id: bot2id,
      score1: score1,
      score2: score2,
    });
  }
}
