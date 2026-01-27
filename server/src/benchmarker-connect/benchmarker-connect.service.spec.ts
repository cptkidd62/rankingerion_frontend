import { Test, TestingModule } from '@nestjs/testing';
import { BenchmarkerConnectService } from './benchmarker-connect.service';

describe('BenchmarkerConnectService', () => {
  let service: BenchmarkerConnectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BenchmarkerConnectService],
    }).compile();

    service = module.get<BenchmarkerConnectService>(BenchmarkerConnectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
