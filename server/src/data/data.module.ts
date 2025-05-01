import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InMemoryUserRepository } from './in-memory/in-memory-user.repository';
import { BotRepository } from './bot.repository';
import { InMemoryBotRepository } from './in-memory/in-memory-bot.repository';
import { MatchRepository } from './match.repository';
import { InMemoryMatchRepository } from './in-memory/in-memory-match.repository';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: InMemoryUserRepository,
    },
    {
      provide: BotRepository,
      useClass: InMemoryBotRepository,
    },
    {
      provide: MatchRepository,
      useClass: InMemoryMatchRepository,
    },
  ],
  exports: [UserRepository, BotRepository, MatchRepository],
})
export class DataModule {}
