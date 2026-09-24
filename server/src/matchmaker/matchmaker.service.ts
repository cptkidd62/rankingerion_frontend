import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '@/config/appconfig.service';
import { Bot, BotRepository, RatingData } from '@/data/bot.repository';

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
  bots: Bot[] = [];
  pendingCache: Map<number, PendingData>;

  constructor(private readonly botRepository: BotRepository, private readonly appConfig: AppConfigService) {
    this.pendingCache = new Map();
  }

  async onModuleInit() {
    this.bots = await this.botRepository.findAll();
    for (const bot of this.bots) {
      this.pendingCache.set(bot.id, createTempData());
    }
  }

  private randomNoise(): number {
    return (Math.random() * 2 - 1) * this.appConfig.config.noise;
  }

  private scoreOpponent1 = (rating_opp: RatingData, rating_own: RatingData) => {
    const r_opp = (this.appConfig.config.ratingForMatchmaking == 'glicko' ? rating_opp.value : rating_opp.trueSkillMu - 3 * rating_opp.trueSkillSigma);
    const r_own = (this.appConfig.config.ratingForMatchmaking == 'glicko' ? rating_own.value : rating_own.trueSkillMu - 3 * rating_own.trueSkillSigma);
    return (r_opp - Math.abs(r_opp - r_own) - rating_opp.lastMatchId + this.randomNoise());
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
    const r_opp = (this.appConfig.config.ratingForMatchmaking == 'glicko' ? rating_opp.value : rating_opp.trueSkillMu - 3 * rating_opp.trueSkillSigma);
    return -r_opp - rating_opp.lastMatchId + this.randomNoise();
  };

  async getNextOpponent(id: number): Promise<number[] | null> {
    const opponents: number[] = [];
    this.bots = await this.botRepository.findAll();
    if (!this.pendingCache.has(id)) {
      this.pendingCache.set(id, createTempData());
    }
    const matches =
      this.pendingCache.get(id)!.matches + this.bots[id].rating.matchesPlayed;
    if (matches >= this.appConfig.config.matchesToPlay) {
      console.log('saturated', matches);
      return null;
    }

    let score: {
      (rating_opp: RatingData, rating_own: RatingData): number;
      (_rating_opp: RatingData, _rating_own: RatingData): number;
      (rating_opp: RatingData, _rating_own: RatingData): number;
      (rating_opp: RatingData, rating_own: RatingData): number;
    };
    // draw scoring heuristic in 10:3:2 ratio
    const r = Math.random();
    if (r < 0.66) {
      score = this.scoreOpponent1;
    } else if (r < 0.86) {
      score = this.scoreOpponent2;
    } else {
      score = this.scoreOpponent3;
    }
    const queue = this.generateQueue(this.bots, id, score);
    for (const id2 of queue) {
      // check if match can happan
      if (this.isMatchOK(this.bots, id, id2)) {
        opponents.push(id2);
        if (opponents.length == this.appConfig.config.playersCount - 1) {
          const all = structuredClone(opponents);
          all.push(id);
          this.addToCache(all);
          return opponents;
        }
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
      (bots[id1].status.type == 'created' || bots[id1].status.type == 'ok') && !bots[id1].status.isDeleted &&
      (bots[id2].status.type == 'created' || bots[id2].status.type == 'ok') && !bots[id2].status.isDeleted &&
      played < this.appConfig.config.maxMatchesPerOpponent // check if not max with this opponent
    );
  }

  private addToCache(ids: number[]) {
    for (let i = 0; i < ids.length; i++) {
      const c1 = this.pendingCache.get(ids[i]);
      c1!.matches++;
      for (let j = 0; j < ids.length; j++) {
        if (j != i) {
          c1!.opponentsCount.set(ids[j], (c1!.opponentsCount.get(ids[j]) ?? 0) + 1);
        }
      }
    }
  }

  removeFromCache(ids: number[]) {
    for (let i = 0; i < ids.length; i++) {
      const c1 = this.pendingCache.get(ids[i]);
      c1!.matches--;
      if (c1!.matches < 0) {
        c1!.matches = 0;
        console.error('cache matches < 0 for id: ' + ids[i]);
      }
      for (let j = 0; j < ids.length; j++) {
        if (j != i) {
          c1!.opponentsCount.set(ids[j], c1!.opponentsCount.get(ids[j])! - 1);
          if (c1!.opponentsCount.get(ids[j]) == 0) c1!.opponentsCount.delete(ids[j]);
        }
      }
    }
  }
}
