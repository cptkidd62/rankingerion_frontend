import { Controller, Get, Param, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Match } from 'src/data/match.repository';

@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get()
  async findAll(@Query('userId') id?: number): Promise<Match[]> {
    return id
      ? this.matchesService.filterByUserId(id)
      : this.matchesService.findAll();
  }

  @Get(':id1-:id2')
  async findById(
    @Param('id1') id1: number,
    @Param('id2') id2: number,
  ): Promise<Match | null> {
    return this.matchesService.findById(id1, id2);
  }
}
