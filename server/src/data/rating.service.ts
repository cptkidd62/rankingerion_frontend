import { Injectable, OnModuleInit } from '@nestjs/common';
import { BotRepository } from './bot.repository';
import { MatchRepository } from './match.repository';

// rating service jest jedyną klasą, która modyfikuje pole rating w bocie
@Injectable()
export class RatingService implements OnModuleInit {
  private nextMatch: number;
  private ratings: Map<number, number>;
  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
  ) {}

  async onModuleInit() {
    await this.recomputeRating();
  }

  async recomputeRating() {
    this.nextMatch = 0;
    const matches = await this.matchRepo.findAll();
    this.ratings = new Map<number, number>();
    for (const match of matches) {
      if (match.id != this.nextMatch) {
        throw new Error('missing match id ' + this.nextMatch);
      } else {
        this.nextMatch++;
      }

      const id1 = match.bot_ids[0];
      const id2 = match.bot_ids[1];

      let rating1 = this.ratings.get(id1) ?? 0;
      let rating2 = this.ratings.get(id2) ?? 0;

      rating1 += match.score[0] - match.score[1];
      rating2 += match.score[1] - match.score[0];

      this.ratings.set(id1, rating1);
      this.ratings.set(id2, rating2);
    }
    const bots = await this.botRepo.findAll();
    const ids = bots.map((bot) => bot.id);
    for (const id of ids) {
      if (!this.ratings.has(id)) {
        this.ratings.set(id, 0);
      }
    }
    for (const [id, rating] of this.ratings) {
      await this.botRepo.updateRatingById(id, rating);
    }
  }
}
