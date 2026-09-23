import { Injectable } from '@nestjs/common';
import { UserRepository, User } from '@/data/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UserRepository) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  async create(username: string, password: string): Promise<User | null> {
    return this.userRepo.create({
      id: 0,
      username: username,
      password: password,
    });
  }

  async deleteById(id: number): Promise<void> {
    return this.userRepo.deleteById(id);
  }
}
