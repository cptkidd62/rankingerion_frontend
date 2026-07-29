import { Injectable } from '@nestjs/common';
import { Bot, BotRepository, RatingData } from 'src/data/bot.repository';

@Injectable()
export class MatchmakerService {
  bots: Bot[];

  private readonly noise: number = 25;
  private readonly M1 = 10;
  private readonly M2 = 3;
  private readonly M3 = 2;

  constructor(private readonly botRepository: BotRepository) {}

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
    const bot_p = this.bots[id];
    console.log(bot_p.rating.matchesPlayed);
    if (bot_p.rating.matchesPlayed < this.M1) {
      const queue1 = this.generateQueue(this.bots, id, this.scoreOpponent1);
      for (const id2 of queue1) {
        // check if match can happan
        if (this.isMatchOK(this.bots, id, id2)) {
          return id2;
        }
      }
    } else if (bot_p.rating.matchesPlayed < this.M1 + this.M2) {
      const queue1 = this.generateQueue(this.bots, id, this.scoreOpponent2);
      for (const id2 of queue1) {
        // check if match can happan
        if (this.isMatchOK(this.bots, id, id2)) {
          return id2;
        }
      }
    } else if (bot_p.rating.matchesPlayed < this.M1 + this.M2 + this.M3) {
      const queue1 = this.generateQueue(this.bots, id, this.scoreOpponent3);
      for (const id2 of queue1) {
        // check if match can happan
        if (this.isMatchOK(this.bots, id, id2)) {
          return id2;
        }
      }
    }
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
