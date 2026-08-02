import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot, BotRepository, RatingData } from 'src/data/bot.repository';

interface PendingData {
  matches: number;
  opponentsCount: Map<number, number>;
}

const createTempData: () => PendingData = () => {
  return {
    matches: 0,
    opponentsCount: new Map(),
  };
};

@Injectable()
export class MatchmakerService implements OnModuleInit {
  bots: Bot[];
  pendingCache: Map<number, PendingData>;

  private readonly noise: number = 25;
  private readonly MATCHES = 100;

  constructor(private readonly botRepository: BotRepository) {
    this.pendingCache = new Map();
  }

  async onModuleInit() {
    this.bots = await this.botRepository.findAll();
    for (const bot of this.bots) {
      this.pendingCache.set(bot.id, createTempData());
    }
  }

  private randomNoise(): number {
    return (Math.random() * 2 - 1) * this.noise;
  }

  private scoreOpponent1 = (rating_opp: RatingData, rating_own: RatingData) => {
    return (
      rating_opp.value -
      Math.abs(rating_opp.value - rating_own.value) -
      rating_opp.lastMatchId +
      this.randomNoise()
    );
  };
  private scoreOpponent2 = (
    _rating_opp: RatingData,
    _rating_own: RatingData,
  ) => {
    return this.randomNoise();
  };
  private scoreOpponent3 = (
    rating_opp: RatingData,
    _rating_own: RatingData,
  ) => {
    return -rating_opp.value - rating_opp.lastMatchId + this.randomNoise();
  };

  async getNextOpponent(id: number): Promise<number | null> {
    this.bots = await this.botRepository.findAll();
    if (!this.pendingCache.has(id)) {
      this.pendingCache.set(id, createTempData());
    }
    const matches =
      this.pendingCache.get(id)!.matches + this.bots[id].rating.matchesPlayed;
    if (matches >= this.MATCHES) {
      console.log('saturated', matches);
      return null;
    }

    let score: {
      (rating_opp: RatingData, rating_own: RatingData): number;
      (_rating_opp: RatingData, _rating_own: RatingData): number;
      (rating_opp: RatingData, _rating_own: RatingData): number;
      (rating_opp: RatingData, rating_own: RatingData): number;
    };
    const r = Math.random();
    if (r < 0.66) {
      // console.log(r, 1);
      score = this.scoreOpponent1;
    } else if (r < 0.86) {
      // console.log(r, 2);
      score = this.scoreOpponent2;
    } else {
      // console.log(r, 3);
      score = this.scoreOpponent3;
    }
    const queue = this.generateQueue(this.bots, id, score);
    for (const id2 of queue) {
      // check if match can happan
      if (this.isMatchOK(this.bots, id, id2)) {
        this.addToCache(id, id2);
        return id2;
      }
    }
    console.log('no remaining');
    return null;
  }

  private generateQueue(
    bots: Bot[],
    id: number,
    scoreOpponent: (rating_opp: RatingData, rating_own: RatingData) => number,
  ): number[] {
    const evs = bots.map((bot) => [
      bot.id,
      scoreOpponent(bot.rating, bots[id].rating),
    ]);
    evs.sort((a, b) => b[1] - a[1]);
    return evs.map((a) => a[0]);
  }

  private isMatchOK(bots: Bot[], id1: number, id2: number) {
    const played =
      (bots[id1].rating.opponentsPlayed.get(id2) ?? 0) +
      (this.pendingCache.get(id1)!.opponentsCount.get(id2) ?? 0);
    return (
      bots[id1].user_id != bots[id2].user_id && //don't allow own bots
      (bots[id1].status.type == 'created' || bots[id1].status.type == 'ok') &&
      (bots[id2].status.type == 'created' || bots[id2].status.type == 'ok') &&
      played == 0 // check if already played
    );
  }

  private addToCache(id1: number, id2: number) {
    const c1 = this.pendingCache.get(id1);
    c1!.matches++;
    c1!.opponentsCount.set(id2, (c1!.opponentsCount.get(id2) ?? 0) + 1);
    const c2 = this.pendingCache.get(id2);
    c2!.matches++;
    c2!.opponentsCount.set(id1, (c2!.opponentsCount.get(id1) ?? 0) + 1);
  }

  removeFromCache(id1: number, id2: number) {
    const c1 = this.pendingCache.get(id1);
    c1!.matches--;
    if (c1!.matches < 0) {
      c1!.matches = 0;
      console.error('cache matches < 0 for id: ' + id1);
    }
    c1!.opponentsCount.set(id2, c1!.opponentsCount.get(id2)! - 1);
    if (c1!.opponentsCount.get(id2) == 0) c1!.opponentsCount.delete(id2);
    const c2 = this.pendingCache.get(id2);
    c2!.matches--;
    if (c2!.matches < 0) {
      c2!.matches = 0;
      console.error('cache matches < 0 for id: ' + id2);
    }
    c2!.opponentsCount.set(id1, c2!.opponentsCount.get(id1)! - 1);
    if (c2!.opponentsCount.get(id1) == 0) c2!.opponentsCount.delete(id1);
  }
}
