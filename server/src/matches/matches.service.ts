import { Injectable } from '@nestjs/common';
import { BotRepository } from 'src/data/bot.repository';
import { MatchRepository, Match } from 'src/data/match.repository';

@Injectable()
export class MatchesService {
  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
  ) {}

  async findAll(): Promise<Match[]> {
    return this.matchRepo.findAll();
  }

  async findById(id1: number, id2: number): Promise<Match | null> {
    return this.matchRepo.findById(id1, id2);
  }

  async filterByBotIds(ids: number[]): Promise<Match[]> {
    return this.matchRepo.filterByBotIds(ids);
  }

  async filterByUserId(id: number): Promise<Match[]> {
    const bots = await this.botRepo.filterByUserId(id);
    const botsIds = bots.map((bot) => bot.id);
    return this.matchRepo.filterByBotIds(botsIds);
  }
}
