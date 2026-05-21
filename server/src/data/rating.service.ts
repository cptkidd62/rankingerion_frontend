import { Injectable, OnModuleInit } from '@nestjs/common';
import { BotRepository } from './bot.repository';
import { MatchRepository } from './match.repository';

@Injectable()
export class RatingService implements OnModuleInit {
  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
  ) {}

  async onModuleInit() {
    const mts = await this.matchRepo.findAll();
    console.log('Rating service created. Match count:', mts.length);
  }
}
