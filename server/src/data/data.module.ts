import { Module } from '@nestjs/common';
import { FileRepositoryModule } from './file/file-repository.module';
import { RatingService } from './rating.service';

const RepositoryModule = FileRepositoryModule;

@Module({
  imports: [RepositoryModule],
  exports: [RepositoryModule, RatingService],
  providers: [RatingService],
})
export class DataModule {}
