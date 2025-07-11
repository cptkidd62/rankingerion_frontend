import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/data/user.repository';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @Post('login')
  async login(
    @Body() { login, password }: { login: string; password: string },
  ) {
    const user = await this.authService.validateUser(login, password);
    return { user: user, token: 'sampletoken' };
  }

  @Post('signup')
  async signup(@Body() { user }: { user: User }) {
    const nuser = await this.userService.create(user.username, user.password);
    return { user: nuser, token: 'sampletoken' };
  }
}
