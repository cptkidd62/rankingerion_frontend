import { Injectable, OnModuleInit } from '@nestjs/common';
import { BotRepository } from './bot.repository';
import { Match, MatchRepository } from './match.repository';

// rating service jest jedyną klasą, która modyfikuje pole rating w bocie oraz sequence_number w match
@Injectable()
export class RatingService implements OnModuleInit {
  private nextSequenceNumber: number;
  private ratings: Map<number, number>;
  private queue = Promise.resolve();

  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
  ) {
    this.nextSequenceNumber = 0;
    this.ratings = new Map<number, number>();
  }

  async onModuleInit() {
    await this.recomputeRating();
  }

  async recomputeRating() {
    return this.serialize(async () => {
      this.nextSequenceNumber = 0;
      const matches = await this.matchRepo.findAll();
      if (matches.length > 0) {
        this.nextSequenceNumber =
          Math.max(...matches.map((match) => match.sequence_number)) + 1;
      }
      this.ratings = new Map<number, number>();
      for (const match of matches) {
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
    });
  }

  async processMatch(match: Match) {
    return this.serialize(async () => {
      const id1 = match.bot_ids[0];
      const id2 = match.bot_ids[1];

      let rating1 = this.ratings.get(id1) ?? 0;
      let rating2 = this.ratings.get(id2) ?? 0;

      rating1 += match.score[0] - match.score[1];
      rating2 += match.score[1] - match.score[0];

      this.ratings.set(id1, rating1);
      this.ratings.set(id2, rating2);

      await this.matchRepo.updateSequenceNumber(
        match.id,
        this.nextSequenceNumber++,
      );

      await this.botRepo.updateRatingById(id1, rating1);
      await this.botRepo.updateRatingById(id2, rating2);
    });
  }

  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const res = this.queue.then(fn, fn);
    this.queue = res.then(
      () => {},
      () => {},
    );
    return res;
  }
}
