import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@/data/user.repository';
import { Match } from '@/data/match.repository';
import { MatchesService } from '@/matches/matches.service';
import { AuthGuard } from '@/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from '@/auth/types';

@Controller('users')
export class UsersController {
  constructor(
    private matchesService: MatchesService,
    private usersService: UsersService,
  ) { }

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

  @UseGuards(AuthGuard)
  @Post(':id/img')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
    @Param('id') id: number
  ) {
    console.log('file', file);
    if (req.user?.id != id) throw new ForbiddenException();
    return this.usersService.updateProfileImage(id, file);
  }
}
