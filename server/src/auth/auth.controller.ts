import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AuthenticatedRequest } from './types';
import { BotRepository } from 'src/data/bot.repository';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private botsRepo: BotRepository,
  ) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return await this.botsRepo.findById(req.user!.id);
  }

  @Post('login')
  async login(
    @Body() { username, password }: { username: string; password: string },
  ) {
    const user = await this.authService.validateUser(username, password);
    const token = this.authService.generateToken(user.id);
    return { user: user, token: token };
  }
}
