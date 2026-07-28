import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot, BotRepository } from 'src/data/bot.repository';

@Injectable()
export class MatchmakerService implements OnModuleInit {
  bots: Bot[];
  id: number;
  player: number;

  constructor(private readonly botRepository: BotRepository) {}

  onModuleInit() {
    this.id = 0;
    this.player = 0;
  }

  async getNextOpponent(id: number): Promise<number | null> {
    if (id != this.player) {
      this.player = id;
      this.id = 0;
    }
    this.bots = await this.botRepository.findAll();
    const i = this.id;
    const bot_p = this.bots[id];
    while (this.id < this.bots.length) {
      const bot_o = this.bots[this.id++];
      if (bot_p.user_id != bot_o.user_id) {
        if (bot_o.status.type == 'created' || bot_o.status.type == 'ok') {
          return i;
        }
      }
    }
    return null;
  }
}
