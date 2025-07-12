import { Injectable } from '@nestjs/common';
import { Bot, BotRepository } from '../bot.repository';

@Injectable()
export class InMemoryBotRepository extends BotRepository {
  private bots: Bot[] = [
    {
      id: 0,
      name: 'Bot J',
      language: 'c',
      user_id: 1,
    },
    {
      id: 1,
      name: 'BotJ',
      language: 'py',
      user_id: 1,
    },
    {
      id: 2,
      name: 'Bot K',
      language: 'cpp',
      user_id: 2,
    },
    {
      id: 3,
      name: 'BotK',
      language: 'cpp',
      user_id: 2,
    },
  ];

  private nextId = 4;

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
    return this.bots.filter((Bot) => Bot.user_id == id);
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
