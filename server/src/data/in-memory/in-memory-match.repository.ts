import { Injectable } from '@nestjs/common';
import { Match, MatchRepository } from '../match.repository';

@Injectable()
export class InMemoryMatchRepository extends MatchRepository {
  private matches: Match[] = [
    {
      bot_id1: 0,
      botname1: 'Bot J',
      user_id1: 0,
      username1: 'john',
      bot_id2: 2,
      botname2: 'Bot K',
      user_id2: 1,
      username2: 'kate',
      scores: [
        [203, 300],
        [34, 9],
        [349, 209],
      ],
    },
    {
      bot_id1: 1,
      botname1: 'BotJ',
      user_id1: 0,
      username1: 'john',
      bot_id2: 2,
      botname2: 'Bot K',
      user_id2: 1,
      username2: 'kate',
      scores: [[34, 9]],
    },
    {
      bot_id1: 0,
      botname1: 'Bot J',
      user_id1: 0,
      username1: 'john',
      bot_id2: 3,
      botname2: 'BotK',
      user_id2: 1,
      username2: 'kate',
      scores: [
        [203, 300],
        [54, 98],
        [333, 329],
      ],
    },
    {
      bot_id1: 1,
      botname1: 'BotJ',
      user_id1: 0,
      username1: 'john',
      bot_id2: 3,
      botname2: 'BotK',
      user_id2: 1,
      username2: 'kate',
      scores: [
        [203, 300],
        [34, 9],
      ],
    },
  ];

  async findAll(): Promise<Match[]> {
    await Promise.resolve();
    return this.matches;
  }

  async findById(id1: number, id2: number): Promise<Match | null> {
    await Promise.resolve();
    return (
      this.matches.find(
        (Match) => Match.bot_id1 == id1 && Match.bot_id2 == id2,
      ) || null
    );
  }

  async filterByBotIds(ids: number[]): Promise<Match[]> {
    await Promise.resolve();
    return this.matches.filter(
      (match) => ids.includes(match.bot_id1) || ids.includes(match.bot_id2),
    );
  }

  async create(match: Match): Promise<void> {
    await Promise.resolve();
    this.matches.push(match);
  }
}
