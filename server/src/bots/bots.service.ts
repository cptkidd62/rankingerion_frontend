import { Injectable } from '@nestjs/common';
import { BotRepository, Bot } from 'src/data/bot.repository';

@Injectable()
export class BotsService {
  constructor(private readonly botRepo: BotRepository) {}

  async findAll(): Promise<Bot[]> {
    return this.botRepo.findAll();
  }

  async findById(id: number): Promise<Bot | null> {
    return this.botRepo.findById(id);
  }

  async filterByUserId(id: number): Promise<Bot[]> {
    return this.botRepo.filterByUserId(id);
  }

  async create(name: string, language: string, userId: number): Promise<void> {
    return this.botRepo.create({
      id: 0,
      name: name,
      language: language,
      userId: userId,
    });
  }

  async deleteById(id: number): Promise<void> {
    return this.botRepo.deleteById(id);
  }
}
