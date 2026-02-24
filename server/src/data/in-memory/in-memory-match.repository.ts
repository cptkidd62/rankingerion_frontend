import { Injectable } from '@nestjs/common';
import { Match, MatchRepository } from '../match.repository';

@Injectable()
export class InMemoryMatchRepository extends MatchRepository {
  private matches: Match[] = [
    {
      bot_ids: [0, 2],
      botnames: ['Bot J', 'Bot K'],
      user_ids: [0, 1],
      usernames: ['john', 'kate'],
      scores: [
        [203, 300],
        [34, 9],
        [349, 209],
      ],
    },
    {
      bot_ids: [1, 2],
      botnames: ['BotJ', 'Bot K'],
      user_ids: [0, 1],
      usernames: ['john', 'kate'],
      scores: [[34, 9]],
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
        (Match) => Match.bot_ids[0] == id1 && Match.bot_ids[1] == id2,
      ) ?? null
    );
  }

  async filterByBotIds(ids: number[]): Promise<Match[]> {
    await Promise.resolve();
    return this.matches.filter(
      (match) =>
        ids.includes(match.bot_ids[0]) ?? ids.includes(match.bot_ids[1]),
    );
  }

  async create(match: Match): Promise<void> {
    await Promise.resolve();
    this.matches.push(match);
  }
}
