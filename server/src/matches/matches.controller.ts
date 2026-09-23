import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Match } from '@/data/match.repository';
import { AuthGuard } from '@/auth/auth.guard';

@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query('userId') id?: number): Promise<Match[]> {
    return id
      ? this.matchesService.filterByUserId(id)
      : this.matchesService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id1-:id2')
  async findById(
    @Param('id1') id1: number,
    @Param('id2') id2: number,
  ): Promise<Match | null> {
    return this.matchesService.findById(id1, id2);
  }
}
