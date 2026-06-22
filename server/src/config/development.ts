import { AppConfig } from './appconfig';

const DevConfig = {
  usersFile: 'users.json',
  botsFile: 'bots.json',
  matchesFile: 'matches.json',
  dataDir: './mock_data',
  botsDir: './mock_data/bots',
  autoSave: true,
};

export const BenchmarkerDevConfig: AppConfig = {
  ...DevConfig,
  useBenchmarker: true,
};

export const NoBenchmarkerDevConfig: AppConfig = {
  ...DevConfig,
  useBenchmarker: false,
};
