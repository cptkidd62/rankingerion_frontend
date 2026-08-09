import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BotsService } from './bots.service';
import { BotDTO } from 'src/data/bot.repository';
import { MatchesService } from 'src/matches/matches.service';
import { Match } from 'src/data/match.repository';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthenticatedRequest } from 'src/auth/types';
import { Response } from 'express';

@Controller('bots')
export class BotsController {
  constructor(
    private botsService: BotsService,
    private matchesService: MatchesService,
  ) { }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query('userId') id?: number): Promise<BotDTO[]> {
    return id
      ? this.botsService.filterByUserId(id)
      : this.botsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findById(@Param('id') id: number): Promise<BotDTO | null> {
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
      language,
      code,
      userId,
    }: {
      name: string;
      language: string;
      code: string;
      userId: number;
    },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    console.log(name, userId);
    console.log('file', file);
    if (req.user?.id != userId) throw new ForbiddenException();
    return this.botsService.createWithMatches(name, file, language, code, userId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteById(
    @Param('id') id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const bot = await this.botsService.findById(id);
    if (req.user?.id != bot?.user_id) throw new ForbiddenException();
    return this.botsService.deleteById(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateById(
    @Param('id') id: number,
    @Req() req: AuthenticatedRequest,
    @Body() { name }: { name: string },
  ) {
    const bot = await this.botsService.findById(id);
    if (req.user?.id != bot?.user_id) throw new ForbiddenException();
    return this.botsService.updateNameById(id, name, bot!.user_id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/file')
  async getFile(
    @Param('id') id: number,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const bot = await this.botsService.findById(id);
    if (bot == null) throw new BadRequestException('Bot ID invalid');
    if (req.user?.id != bot.user_id) throw new ForbiddenException();
    const botData = await this.botsService.getFile(id);
    res.setHeader('Content-Type', botData.mimeType);
    res.setHeader('Content-Disposition', `inline; filename=${botData.filename}`);
    res.send(botData.contents);
  }
}
