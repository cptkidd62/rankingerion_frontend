import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { BotsService } from './bots.service';
import { Bot } from 'src/data/bot.repository';
import { MatchesService } from 'src/matches/matches.service';
import { Match } from 'src/data/match.repository';
import { promises as fs } from 'fs';
import * as path from 'path';

@Controller('bots')
export class BotsController {
  constructor(
    private botsService: BotsService,
    private matchesService: MatchesService,
  ) {}

  @Get()
  async findAll(@Query('userId') id?: number): Promise<Bot[]> {
    return id
      ? this.botsService.filterByUserId(id)
      : this.botsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<Bot | null> {
    return this.botsService.findById(id);
  }

  @Get(':id/matches')
  async filterMatchesById(@Param('id') id: number): Promise<Match[]> {
    return this.matchesService.filterByBotIds([id]);
  }

  @Post()
  async create(
    @Body()
    {
      name,
      language,
      code,
      userId,
    }: {
      name: string;
      language: string;
      code: string;
      userId: number;
    },
  ) {
    const filePath = path.join(
      process.env.BOTS_DIR ?? './',
      name + '.' + language,
    );
    await fs.writeFile(filePath, code, 'utf-8');
    return this.botsService.createWithMockMatches(name, language, userId);
  }

  @Delete(':id')
  async deleteById(@Param('id') id: number): Promise<void> {
    return this.botsService.deleteById(id);
  }
}
