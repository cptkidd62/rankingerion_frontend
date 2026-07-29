import { Injectable, OnModuleInit } from '@nestjs/common';
import { BotRepository, RatingData } from './bot.repository';
import { Match, MatchRepository } from './match.repository';
import { glicko } from './glicko';

export const glickoData = { initialRating: 1500, RD: 350 } as const;

export const initialRating = {
  value: glickoData.initialRating,
  RD: glickoData.RD,
  lastMatchId: -1,
  opponentsPlayed: new Map<number, number>(),
} as RatingData;

// rating service jest jedyną klasą, która modyfikuje pole rating w bocie oraz sequence_number w match
@Injectable()
export class RatingService implements OnModuleInit {
  private nextSequenceNumber: number;
  private ratings: Map<number, RatingData>;
  private queue = Promise.resolve();
  private newRating = structuredClone(initialRating);

  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
  ) {
    this.nextSequenceNumber = 0;
    this.ratings = new Map<number, RatingData>();
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
      this.ratings = new Map<number, RatingData>();
      for (const match of matches) {
        this.doMatch(match);

        const id1 = match.bot_ids[0];
        const id2 = match.bot_ids[1];

        const rating1 = this.ratings.get(id1)!;
        const rating2 = this.ratings.get(id2)!;

        rating1.opponentsPlayed.set(
          id2,
          rating1.opponentsPlayed.get(id2) ?? 0 + 1,
        );

        rating2.opponentsPlayed.set(
          id1,
          rating2.opponentsPlayed.get(id1) ?? 0 + 1,
        );

        rating1.lastMatchId = this.nextSequenceNumber;
        rating2.lastMatchId = this.nextSequenceNumber;
      }
      const bots = await this.botRepo.findAll();
      const ids = bots.map((bot) => bot.id);
      for (const id of ids) {
        if (!this.ratings.has(id)) {
          this.ratings.set(id, structuredClone(this.newRating));
        }
      }
      for (const [id, rating] of this.ratings) {
        await this.botRepo.updateRatingById(id, rating);
      }
    });
  }

  async processMatch(match: Match) {
    return this.serialize(async () => {
      this.doMatch(match);

      const id1 = match.bot_ids[0];
      const id2 = match.bot_ids[1];

      const rating1 = this.ratings.get(id1)!;
      const rating2 = this.ratings.get(id2)!;

      rating1.opponentsPlayed.set(
        id2,
        rating1.opponentsPlayed.get(id2) ?? 0 + 1,
      );

      rating2.opponentsPlayed.set(
        id1,
        rating2.opponentsPlayed.get(id1) ?? 0 + 1,
      );

      rating1.lastMatchId = this.nextSequenceNumber;
      rating2.lastMatchId = this.nextSequenceNumber;

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

  private doMatch(match: Match) {
    const id1 = match.bot_ids[0];
    const id2 = match.bot_ids[1];

    const rating1 = this.ratings.get(id1) ?? structuredClone(this.newRating);
    const rating2 = this.ratings.get(id2) ?? structuredClone(this.newRating);

    const [r1, r2] = glicko(match.score, rating1, rating2);

    this.ratings.set(id1, r1);
    this.ratings.set(id2, r2);
  }
}
