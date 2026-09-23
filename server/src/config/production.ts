import { AppConfig } from './appconfig';

export const ProdConfig: AppConfig = {
  usersFile: 'users.json',
  botsFile: 'bots.json',
  matchesFile: 'matches.json',
  dataDir: './mock_data',
  botsDir: './mock_data/bots',
  useBenchmarker: true,
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
};
