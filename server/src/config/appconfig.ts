export type AppConfig = {
  usersFile: string;
  botsFile: string;
  matchesFile: string;
  dataDir: string;
  botsDir: string;

  useBenchmarker: boolean;

  autoSave: boolean;

  gameName: string;
  referee: string;
  playersCount: number;

  // matchmaking
  ratingForMatchmaking: 'glicko' | 'trueskill';
  acceptedTextExtentions: string[];
  acceptedBinExtentions: string[];
  matchesToPlay: number;
  maxMatchesPerOpponent: number;
  noise: number;

  // bots
  maxBotsPerUser: number;
};

export type PublicConfig = {
  acceptedTextExtentions: string[];
  gameName: string;
  matchesToPlay: number;
  maxBotsPerUser: number;
}
