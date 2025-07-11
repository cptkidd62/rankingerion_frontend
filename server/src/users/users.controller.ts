import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'src/data/user.repository';
import { Match } from 'src/data/match.repository';
import { MatchesService } from 'src/matches/matches.service';

@Controller('users')
export class UsersController {
  constructor(
    private matchesService: MatchesService,
    private usersService: UsersService,
  ) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<User | null> {
    return this.usersService.findById(id);
  }

  @Get(':id/matches')
  async filterByUserIs(@Param('id') id: number): Promise<Match[]> {
    return this.matchesService.filterByUserId(id);
  }

  @Post()
  async create(
    @Body()
    { username, password }: { username: string; password: string },
  ) {
    return this.usersService.create(username, password);
  }

  @Delete(':id')
  async deleteById(@Param('id') id: number): Promise<void> {
    return this.usersService.deleteById(id);
  }
}
