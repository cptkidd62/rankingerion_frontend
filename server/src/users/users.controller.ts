import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from 'src/data/user.repository';
import { Match } from 'src/data/match.repository';
import { MatchesService } from 'src/matches/matches.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private matchesService: MatchesService,
    private usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findById(@Param('id') id: number): Promise<User | null> {
    return this.usersService.findById(id);
  }

  @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteById(@Param('id') id: number): Promise<void> {
    return this.usersService.deleteById(id);
  }
}
