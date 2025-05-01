import { Injectable } from '@nestjs/common';
import { Match, MatchRepository } from '../match.repository';

@Injectable()
export class InMemoryMatchRepository extends MatchRepository {
  private matches: Match[] = [
    {
      id: 1,
      bot1id: 1,
      bot2id: 3,
      score1: 123,
      score2: 213,
    },
    {
      id: 2,
      bot1id: 2,
      bot2id: 3,
      score1: 23,
      score2: 13,
    },
    {
      id: 3,
      bot1id: 4,
      bot2id: 2,
      score1: 203,
      score2: 913,
    },
    {
      id: 4,
      bot1id: 1,
      bot2id: 2,
      score1: 203,
      score2: 113,
    },
  ];

  private nextId = 5;

  async findAll(): Promise<Match[]> {
    await Promise.resolve();
    return this.matches;
  }

  async findById(id: number): Promise<Match | null> {
    await Promise.resolve();
    return this.matches.find((Match) => Match.id == id) || null;
  }

  async filterByBotIds(ids: number[]): Promise<Match[]> {
    await Promise.resolve();
    return this.matches.filter(
      (match) => ids.includes(match.bot1id) || ids.includes(match.bot2id),
    );
  }

  async create(match: Match): Promise<void> {
    await Promise.resolve();
    match.id = this.nextId++;
    this.matches.push(match);
  }
}
