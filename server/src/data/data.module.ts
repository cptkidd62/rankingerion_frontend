import { Module } from '@nestjs/common';
import { FileRepositoryModule } from './file/file-repository.module';

const RepositoryModule = FileRepositoryModule;

@Module({
  imports: [RepositoryModule],
  exports: [RepositoryModule],
})
export class DataModule {}
