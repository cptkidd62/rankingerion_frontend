import { AppConfig } from './appconfig';

const DevConfig = {
  usersFile: 'users.json',
  botsFile: 'bots.json',
  matchesFile: 'matches.json',
  dataDir: './mock_data',
  botsDir: './mock_data/bots',
  autoSave: true,
  gameName: 'TestGame',
  referee: 'Sandbox',
  playersCount: 2,
  ratingForMatchmaking: 'glicko',
  acceptedTextExtentions: ['.cpp'],
  acceptedBinExtentions: ['.exe'],
  matchesToPlay: 100,
  maxMatchesPerOpponent: 10,
  maxBotsPerUser: 10,
  noise: 25
} as AppConfig;

export const BenchmarkerDevConfig: AppConfig = {
  ...DevConfig,
  useBenchmarker: true,
};

export const NoBenchmarkerDevConfig: AppConfig = {
  ...DevConfig,
  useBenchmarker: false,
};

export const NoBenchmarker3PlayerDevConfig: AppConfig = {
  ...DevConfig,
  useBenchmarker: false,
  botsFile: 'bots3.json',
  matchesFile: 'matches3.json',
  playersCount: 3,
  ratingForMatchmaking: 'trueskill'
};
