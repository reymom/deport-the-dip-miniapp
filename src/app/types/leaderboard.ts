export interface LeaderboardEntry {
  address: string;
  score: number;
  followerCount: number;
  volume?: number;
  pnl?: number;
  rank?: number;
  winRate?: number;
  totalTrades?: number;
}
