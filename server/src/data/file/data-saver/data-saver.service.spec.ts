import { Test, TestingModule } from '@nestjs/testing';
import { DataSaverService } from './data-saver.service';

describe('DataSaverService', () => {
  let service: DataSaverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataSaverService],
    }).compile();

    service = module.get<DataSaverService>(DataSaverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
