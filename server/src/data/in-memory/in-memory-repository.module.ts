import { Module } from '@nestjs/common';
import { InMemoryUserRepository } from './in-memory-user.repository';
import { InMemoryBotRepository } from './in-memory-bot.repository';
import { InMemoryMatchRepository } from './in-memory-match.repository';
import { UserRepository } from '../user.repository';
import { BotRepository } from '../bot.repository';
import { MatchRepository } from '../match.repository';

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
export class InMemoryRepositoryModule {}
