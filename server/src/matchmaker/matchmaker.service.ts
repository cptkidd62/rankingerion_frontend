import { Injectable } from '@nestjs/common';
import { Bot, BotRepository, RatingData } from 'src/data/bot.repository';

@Injectable()
export class MatchmakerService {
  bots: Bot[];
  matchesPlanned: Map<number, number>;

  private readonly noise: number = 25;
  private readonly M1 = 10;
  private readonly M2 = 3;
  private readonly M3 = 2;

  constructor(private readonly botRepository: BotRepository) {
    this.matchesPlanned = new Map();
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
    const matches =
      this.matchesPlanned.get(id) ?? this.bots[id].rating.matchesPlayed;

    let score: {
      (rating_opp: RatingData, rating_own: RatingData): number;
      (_rating_opp: RatingData, _rating_own: RatingData): number;
      (rating_opp: RatingData, _rating_own: RatingData): number;
      (rating_opp: RatingData, rating_own: RatingData): number;
    };
    if (matches < this.M1) {
      score = this.scoreOpponent1;
    } else if (matches < this.M1 + this.M2) {
      score = this.scoreOpponent2;
    } else if (matches < this.M1 + this.M2 + this.M3) {
      score = this.scoreOpponent3;
    } else {
      this.matchesPlanned.delete(id);
      return null;
    }
    const queue = this.generateQueue(this.bots, id, score);
    for (const id2 of queue) {
      // check if match can happan
      if (this.isMatchOK(this.bots, id, id2)) {
        this.matchesPlanned.set(id, matches + 1);
        return id2;
      }
    }
    this.matchesPlanned.delete(id);
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
    return (
      bots[id1].user_id != bots[id2].user_id && //don't allow own bots
      (bots[id1].status.type == 'created' || bots[id1].status.type == 'ok') &&
      (bots[id2].status.type == 'created' || bots[id2].status.type == 'ok') &&
      !bots[id1].rating.opponentsPlayed.has(id2) // check if already played
    );
  }
}
