import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from 'src/data/user.repository';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { AuthenticatedRequest } from './types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private userRepo: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? '');
      const id = Number(payload.sub);
      const user = await this.userRepo.findById(id);
      if (!user) {
        throw new UnauthorizedException();
      }
      request.user = user;
      return true;
    } catch (err) {
      console.log('error verifying token: ', err);
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
