import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from 'src/data/user.repository';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

export interface AuthUser {
  id: number;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async validateUser(username: string, password: string): Promise<AuthUser> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid username');
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    return { id: user.id, username: user.username };
  }

  generateToken(userId: number): string {
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? '', {
      expiresIn: '14d',
    });
  }
}
