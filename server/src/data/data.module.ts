import { Module } from '@nestjs/common';
import { FileRepositoryModule } from './file/file-repository.module';
import { InMemoryRepositoryModule } from './in-memory/in-memory-repository.module';

const RepositoryModule =
  process.env.REPO_TYPE === 'file'
    ? FileRepositoryModule
    : process.env.REPO_TYPE === 'memory'
      ? InMemoryRepositoryModule
      : FileRepositoryModule;

@Module({
  imports: [RepositoryModule],
  exports: [RepositoryModule],
})
export class DataModule {}
