export type AppConfig = {
  usersFile: string;
  botsFile: string;
  matchesFile: string;
  dataDir: string;
  botsDir: string;

  useBenchmarker: boolean;

  autoSave: boolean;

  // matchmaking
  acceptedExtentions: string[];
  matchesToPlay: number;
  maxMatchesPerOpponent: number;
  noise: number;

  // bots
  maxBotsPerUser: number;
};

export type PublicConfig = {
  matchesToPlay: number;
  maxBotsPerUser: number;
}
