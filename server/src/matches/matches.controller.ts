import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Match, MatchFull } from 'src/data/match.repository';

@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get()
  async findAll(): Promise<MatchFull[]> {
    return this.matchesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<Match | null> {
    return this.matchesService.findById(id);
  }

  @Post()
  async create(
    @Body()
    {
      bot1id,
      bot2id,
      score1,
      score2,
    }: {
      bot1id: number;
      bot2id: number;
      score1: number;
      score2: number;
    },
  ) {
    return this.matchesService.create(bot1id, bot2id, score1, score2);
  }
}
