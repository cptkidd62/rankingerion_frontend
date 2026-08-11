export type AppConfig = {
  usersFile: string;
  botsFile: string;
  matchesFile: string;
  dataDir: string;
  botsDir: string;

  useBenchmarker: boolean;

  autoSave: boolean;

  gameName: string;

  // matchmaking
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
  matchesToPlay: number;
  maxBotsPerUser: number;
}
