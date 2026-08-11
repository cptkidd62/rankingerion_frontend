import { AppConfig } from './appconfig';

export const DataTestConfig: AppConfig = {
  usersFile: 'users.json',
  botsFile: 'tests/bots.json',
  matchesFile: 'tests/matches.json',
  dataDir: './mock_data',
  botsDir: './mock_data/tests/bots',
  autoSave: true,
  gameName: 'TestGame',
  useBenchmarker: false,
  acceptedTextExtentions: ['.cpp'],
  acceptedBinExtentions: ['.exe'],
  matchesToPlay: 0,
  maxMatchesPerOpponent: 0,
  maxBotsPerUser: 0,
  noise: 25
};
