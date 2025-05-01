import { Injectable } from '@nestjs/common';
import { Bot, BotRepository } from '../bot.repository';

@Injectable()
export class InMemoryBotRepository extends BotRepository {
  private bots: Bot[] = [
    {
      id: 1,
      name: 'Bot J',
      file: 'bj',
      userId: 1,
    },
    {
      id: 2,
      name: 'BotJ',
      file: 'bjo',
      userId: 1,
    },
    {
      id: 3,
      name: 'Bot K',
      file: 'bk',
      userId: 2,
    },
    {
      id: 4,
      name: 'BotK',
      file: 'bka',
      userId: 2,
    },
  ];

  private nextId = 5;

  async findAll(): Promise<Bot[]> {
    await Promise.resolve();
    return this.bots;
  }

  async findById(id: number): Promise<Bot | null> {
    await Promise.resolve();
    return this.bots.find((Bot) => Bot.id == id) || null;
  }

  async filterByUserId(id: number): Promise<Bot[]> {
    await Promise.resolve();
    return this.bots.filter((Bot) => Bot.userId == id);
  }

  async create(bot: Bot): Promise<void> {
    await Promise.resolve();
    bot.id = this.nextId++;
    this.bots.push(bot);
  }

  async deleteById(id: number): Promise<void> {
    await Promise.resolve();
    this.bots = this.bots.filter((bot) => bot.id != id);
  }
}
