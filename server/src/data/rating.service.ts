import { Injectable, OnModuleInit } from '@nestjs/common';
import { BotRepository, RatingData } from './bot.repository';
import { Match, MatchRepository } from './match.repository';

export const ratingSystems = {
  simple: { initialRating: 0 },
  elo16: { initialRating: 1000, k: 16 },
  elo64: { initialRating: 1000, k: 64 },
} as const;

export type RatingVersion = keyof typeof ratingSystems;

export function createInitialRatings(): Record<RatingVersion, RatingData> {
  return Object.fromEntries(
    Object.entries(ratingSystems).map(([version, config]) => [
      version,
      {
        value: config.initialRating,
      },
    ]),
  ) as Record<RatingVersion, RatingData>;
}

// rating service jest jedyną klasą, która modyfikuje pole rating w bocie oraz sequence_number w match
@Injectable()
export class RatingService implements OnModuleInit {
  private nextSequenceNumber: number;
  private ratings: Map<number, Record<RatingVersion, RatingData>>;
  private queue = Promise.resolve();
  private newRating = createInitialRatings();

  constructor(
    private readonly botRepo: BotRepository,
    private readonly matchRepo: MatchRepository,
  ) {
    this.nextSequenceNumber = 0;
    this.ratings = new Map<number, Record<RatingVersion, RatingData>>();
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
      this.ratings = new Map<number, Record<RatingVersion, RatingData>>();
      for (const match of matches) {
        this.doMatch(match);
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

      const rating1 = this.ratings.get(id1) ?? structuredClone(this.newRating);
      const rating2 = this.ratings.get(id2) ?? structuredClone(this.newRating);

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

    for (const version of Object.keys(ratingSystems) as RatingVersion[]) {
      const [r1, r2] = this.calculateRating(
        version,
        match.score,
        rating1[version].value,
        rating2[version].value,
      );
      rating1[version].value = r1;
      rating2[version].value = r2;
    }

    this.ratings.set(id1, rating1);
    this.ratings.set(id2, rating2);
  }

  private calculateRating(
    version: RatingVersion,
    matchScore: number[],
    rating1: number,
    rating2: number,
  ): [number, number] {
    switch (version) {
      case 'simple':
        return this.simpleRating(matchScore, rating1, rating2);
      case 'elo16':
        return this.eloRating(
          matchScore,
          rating1,
          rating2,
          ratingSystems.elo16.k,
        );
      case 'elo64':
        return this.eloRating(
          matchScore,
          rating1,
          rating2,
          ratingSystems.elo64.k,
        );
    }
  }

  private simpleRating(
    matchScore: number[],
    rating1: number,
    rating2: number,
  ): [number, number] {
    return [rating1 + matchScore[0], rating2 + matchScore[1]];
  }

  private eloRating(
    matchScore: number[],
    rating1: number,
    rating2: number,
    k: number,
  ): [number, number] {
    const e = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
    const s = (matchScore[0] + 1) / 2;
    return [
      this.eloUpdate(rating1, k, s, e),
      this.eloUpdate(rating2, k, 1 - s, 1 - e),
    ];
  }

  private eloUpdate(old: number, k: number, s: number, e: number): number {
    return old + k * (s - e);
  }
}
