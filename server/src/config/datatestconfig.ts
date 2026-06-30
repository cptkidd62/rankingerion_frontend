import { AppConfig } from './appconfig';

export const DataTestConfig: AppConfig = {
  usersFile: 'users.json',
  botsFile: 'tests/bots.json',
  matchesFile: 'tests/matches.json',
  dataDir: './mock_data',
  botsDir: './mock_data/tests/bots',
  autoSave: true,
  useBenchmarker: false,
  botName: '_test',
};
