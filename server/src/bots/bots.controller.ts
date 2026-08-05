import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BotsService } from './bots.service';
import { Bot } from 'src/data/bot.repository';
import { MatchesService } from 'src/matches/matches.service';
import { Match } from 'src/data/match.repository';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('bots')
export class BotsController {
  constructor(
    private botsService: BotsService,
    private matchesService: MatchesService,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query('userId') id?: number): Promise<Bot[]> {
    return id
      ? this.botsService.filterByUserId(id)
      : this.botsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findById(@Param('id') id: number): Promise<Bot | null> {
    return this.botsService.findById(id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/matches')
  async filterMatchesById(@Param('id') id: number): Promise<Match[]> {
    return this.matchesService.filterByBotIds([id]);
  }

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body()
    {
      name,
      userId,
    }: {
      name: string;
      userId: number;
    },
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(name, userId);
    console.log('file', file);
    return this.botsService.createWithMatches(name, file, userId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteById(@Param('id') id: number): Promise<void> {
    return this.botsService.deleteById(id);
  }
}
