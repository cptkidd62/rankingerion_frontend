import { AppConfig } from './appconfig';

export const ProdConfig: AppConfig = {
  usersFile: 'users.json',
  botsFile: 'bots.json',
  matchesFile: 'matches.json',
  dataDir: './mock_data', // path to folder where usersFile, botsFile and matchesFile are located
  botsDir: './mock_data/bots', // path to folder where uploaded bots are saved
  useBenchmarker: true, // Benchmarker vs mock matches - do not modify for production
  gameName: 'TestGame', // name of game displayed on the website
  referee: 'Sandbox', // name of referee in Benchmarker
  playersCount: 2, // number of players per game
  ratingForMatchmaking: 'glicko', // rating used for matchmaking - 'glicko' or 'trueskill' ('glicko' available only for 2 players)
  acceptedTextExtentions: ['.cpp'],
  acceptedBinExtentions: ['.exe'],
  matchesToPlay: 100, // number of matches to generate for a newly added bot
  maxMatchesPerOpponent: 10, // max number of matches between two bots in initial matchmaking
  maxBotsPerUser: 10, // max number of active bots per user
  noise: 25 // random noise for matchmaking functions - do not modify
};
