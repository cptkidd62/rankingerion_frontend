import { Module } from '@nestjs/common';
import { FileRepositoryModule } from './file/file-repository.module';
import { RatingService } from './rating.service';
import { AppConfigService } from '@/config/appconfig.service';

const RepositoryModule = FileRepositoryModule;

@Module({
  imports: [RepositoryModule],
  exports: [RepositoryModule, RatingService],
  providers: [RatingService, AppConfigService],
})
export class DataModule {}
