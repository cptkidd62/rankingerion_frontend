export type PublicConfig = {
  acceptedTextExtentions: string[];
  gameName: string;
  playersCount: number;
  ratingForMatchmaking: 'glicko' | 'trueskill';
  matchesToPlay: number;
  maxBotsPerUser: number;
}
