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

  async getAllImages(): Promise<Record<number, string>> {
    const images: Record<number, string> = {};
    const users = await this.userRepo.findAll();

    for (const user of users) {
      if (user.filename == '') {
        continue;
      }

      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
      }

      const buffer = await fs.readFile(this.makeImageFullPath(user.filename));

      images[user.id] =
        `data:${mimeTypes[this.getExtention(user.filename)]};base64,${buffer.toString('base64')}`;
    }

    return images;
  }

  private getExtention(filepath: string): string {
    return path.extname(filepath);
  }

  private makeImageFullPath(filename: string): string {
    return path.join(this.appConfig.config.imgsDir, filename);
  }
}
