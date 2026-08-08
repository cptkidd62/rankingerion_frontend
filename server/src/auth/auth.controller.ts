import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AuthenticatedRequest } from './types';
import { UserRepository } from 'src/data/user.repository';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userRepo: UserRepository,
  ) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return await this.userRepo.findById(req.user!.id);
  }

  @UseGuards(AuthGuard)
  @Patch('me/password')
  async changePassword(@Req() req: AuthenticatedRequest,
    @Body() { password }: { password: string }) {
    if (await this.userRepo.findById(req.user!.id) == null) {
      throw new BadRequestException('User not found');
    }
    if (password == '') {
      throw new BadRequestException('Password cannot be empty')
    }
    return await this.userRepo.updatePassword(req.user!.id, bcrypt.hashSync(password, 12))
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
