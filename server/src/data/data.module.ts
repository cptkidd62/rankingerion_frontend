import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { FileUserRepository } from './file/file-user.repository';
import { BotRepository } from './bot.repository';
import { FileBotRepository } from './file/file-bot.repository';
import { MatchRepository } from './match.repository';
import { FileMatchRepository } from './file/file-match.repository';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: FileUserRepository,
    },
    {
      provide: BotRepository,
      useClass: FileBotRepository,
    },
    {
      provide: MatchRepository,
      useClass: FileMatchRepository,
    },
  ],
  exports: [UserRepository, BotRepository, MatchRepository],
})
export class DataModule {}
