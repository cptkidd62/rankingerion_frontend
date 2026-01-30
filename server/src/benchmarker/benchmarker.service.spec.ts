import { Test, TestingModule } from '@nestjs/testing';
import { BenchmarkerService } from './benchmarker.service';

describe('BenchmarkerService', () => {
  let service: BenchmarkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BenchmarkerService],
    }).compile();

    service = module.get<BenchmarkerService>(BenchmarkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
