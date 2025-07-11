import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() { username, password }: { username: string; password: string },
  ) {
    const user = await this.authService.validateUser(username, password);
    return { user: user, token: 'sampletoken' };
  }
}
