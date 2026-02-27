import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BotsService } from './bots.service';
import { Bot } from 'src/data/bot.repository';
import { MatchesService } from 'src/matches/matches.service';
import { Match } from 'src/data/match.repository';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body()
    {
      name,
      language,
      userId,
    }: {
      name: string;
      language: string;
      userId: number;
    },
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(name, language, userId);
    console.log('file', file);
    if (process.env.USE_BENCHMARKER == 'true')
      return this.botsService.createWithBenchmarkerMatches(
        name,
        language,
        'code',
        userId,
      );
    else
      return this.botsService.createWithMockMatches(
        name,
        language,
        'code',
        userId,
      );
  }

  @Delete(':id')
  async deleteById(@Param('id') id: number): Promise<void> {
    return this.botsService.deleteById(id);
  }
}
