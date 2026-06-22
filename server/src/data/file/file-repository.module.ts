import { Module } from '@nestjs/common';
import { MatchRepository } from '../match.repository';
import { BotRepository } from '../bot.repository';
import { UserRepository } from '../user.repository';
import { FileUserRepository } from './file-user.repository';
import { FileBotRepository } from './file-bot.repository';
import { FileMatchRepository } from './file-match.repository';
import { DataSaverService } from './data-saver/data-saver.service';
import { AppConfigService } from 'src/config/appconfig.service';

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
    DataSaverService,
    AppConfigService,
  ],
  exports: [UserRepository, BotRepository, MatchRepository],
})
export class FileRepositoryModule {}
