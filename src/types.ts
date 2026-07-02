export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface Match {
  id: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  status: MatchStatus;
}

export interface TeamStanding {
  name: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  scoreFor: number; // The points they scored in the match
  scoreAgainst: number; // The points scored against them
  scoreDifference: number; // The difference
}

export interface TournamentSettings {
  winPoints: number;
  losePoints: number;
}
