import { AppConfig } from './appconfig';

const DevConfig = {
  usersFile: 'users.json',
  botsFile: 'bots.json',
  matchesFile: 'matches.json',
  dataDir: './mock_data',
  botsDir: './mock_data/bots',
  autoSave: true,
  acceptedTextExtentions: ['.cpp'],
  acceptedBinExtentions: ['.exe'],
  matchesToPlay: 100,
  maxMatchesPerOpponent: 10,
  maxBotsPerUser: 10,
  noise: 25
};

export const BenchmarkerDevConfig: AppConfig = {
  ...DevConfig,
  useBenchmarker: true,
};

export const NoBenchmarkerDevConfig: AppConfig = {
  ...DevConfig,
  useBenchmarker: false,
};
