import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User, UserRepository } from 'src/data/user.repository';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Nieprawidłowy login');
    }

    const passwordsMatch = password == user.password;
    if (!passwordsMatch) {
      throw new UnauthorizedException('Nieprawidłowe hasło');
    }

    return user;
  }

  generateToken(userId: number): string {
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? '', {
      expiresIn: '1h',
    });
  }
}
