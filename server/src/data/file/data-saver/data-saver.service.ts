import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { BotRepository } from 'src/data/bot.repository';
import { MatchRepository } from 'src/data/match.repository';

@Injectable()
export class DataSaverService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout;

  constructor(
    @Inject(BotRepository)
    private botRepo: BotRepository & { saveData(): Promise<void> },
    @Inject(MatchRepository)
    private matchRepo: MatchRepository & { saveData(): Promise<void> },
  ) {}

  onModuleInit() {
    this.intervalId = setInterval(() => {
      this.botRepo
        .saveData()
        .catch((err) => console.error('Error writing bot repo: ' + err));
      this.matchRepo
        .saveData()
        .catch((err) => console.error('Error writing match repo: ' + err));
    }, 15000);
  }

  async onModuleDestroy() {
    clearInterval(this.intervalId);
    // Ostatnia próba zapisu przy wyłączaniu
    await this.botRepo.saveData();
    await this.matchRepo.saveData();
  }
}
