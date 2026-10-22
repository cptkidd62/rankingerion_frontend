import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRepository, User } from '@/data/user.repository';
import * as path from 'path';
import { AppConfigService } from '@/config/appconfig.service';
import { promises as fs } from 'fs';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UserRepository, private readonly appConfig: AppConfigService) { }

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
      filename: '',
    });
  }

  async deleteById(id: number): Promise<void> {
    return this.userRepo.deleteById(id);
  }

  async updateProfileImage(id: number, file: Express.Multer.File): Promise<void> {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
    ]
    if (file != undefined) {
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('Unsupported file type');
      }
      const ext = this.getExtention(file.originalname);
      const uuid = crypto.randomUUID();
      const filePath = this.makeImageFullPath(uuid + ext);
      await fs.writeFile(filePath, file.buffer, 'utf-8');
      this.userRepo.updateFilename(id, uuid + ext);
    }
  }

  private getExtention(filepath: string): string {
    return path.extname(filepath);
  }

  private makeImageFullPath(filename: string): string {
    return path.join(this.appConfig.config.imgsDir, filename);
  }
}
