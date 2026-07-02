import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Clock, PlayCircle, CheckCircle2, Trophy, Settings, X, Award, ChevronRight } from 'lucide-react';
import { Match, MatchStatus, TeamStanding, TournamentSettings } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [matches, setMatches] = useState<Match[]>([]);

  const [settings, setSettings] = useState<TournamentSettings>({
    winPoints: 3,
    losePoints: 3,
  });

  const [registeredTeamsInput, setRegisteredTeamsInput] = useState<string>('');
  
  const [tournamentName, setTournamentName] = useState('Tournament Live');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    team1: '',
    team2: '',
    status: 'upcoming',
  });

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatch.team1 || !newMatch.team2) return;

    const match: Match = {
      id: generateId(),
      team1: newMatch.team1,
      team2: newMatch.team2,
      score1: 0,
      score2: 0,
      status: newMatch.status as MatchStatus,
    };

    setMatches([...matches, match]);
    setNewMatch({ team1: '', team2: '', status: 'upcoming' });
  };

  const setScore = (id: string, team: 1 | 2, value: number) => {
    setMatches(matches.map(m => {
      if (m.id === id) {
        if (team === 1) {
          return { ...m, score1: Math.max(0, value) };
        } else {
          return { ...m, score2: Math.max(0, value) };
        }
      }
      return m;
    }));
  };

  const updateStatus = (id: string, status: MatchStatus) => {
    setMatches(matches.map(m => m.id === id ? { ...m, status } : m));
  };

  const deleteMatch = (id: string) => {
    setMatches(matches.filter(m => m.id !== id));
  };

  const parsedTeams = useMemo(() => {
    return Array.from(new Set(registeredTeamsInput
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)));
  }, [registeredTeamsInput]);

  const standings = useMemo(() => {
    const teams = new Map<string, TeamStanding>();

    parsedTeams.forEach(name => {
      teams.set(name, {
        name,
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        scoreFor: 0,
        scoreAgainst: 0,
        scoreDifference: 0,
      });
    });

    const getTeam = (name: string): TeamStanding => {
      if (!teams.has(name)) {
        teams.set(name, {
          name,
          played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          scoreFor: 0,
          scoreAgainst: 0,
          scoreDifference: 0,
        });
      }
      return teams.get(name)!;
    };

    matches.forEach(m => {
      const t1 = getTeam(m.team1);
      const t2 = getTeam(m.team2);

      if (m.status === 'finished') {
        t1.played += 1;
        t2.played += 1;
        
        t1.scoreFor += m.score1;
        t1.scoreAgainst += m.score2;
        t1.scoreDifference += (m.score1 - m.score2);

        t2.scoreFor += m.score2;
        t2.scoreAgainst += m.score1;
        t2.scoreDifference += (m.score2 - m.score1);

        if (m.score1 > m.score2) {
          t1.wins += 1;
          t2.losses += 1;
          t1.points += settings.winPoints;
          t2.points -= settings.losePoints;
        } else if (m.score2 > m.score1) {
          t2.wins += 1;
          t1.losses += 1;
          t2.points += settings.winPoints;
          t1.points -= settings.losePoints;
        } else {
          t1.draws += 1;
          t2.draws += 1;
        }
      }
    });

    return Array.from(teams.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.scoreDifference !== a.scoreDifference) return b.scoreDifference - a.scoreDifference;
      return b.scoreFor - a.scoreFor;
    });
  }, [matches, settings, parsedTeams]);

  const StatusIcon = ({ status }: { status: MatchStatus }) => {
    switch (status) {
      case 'live': return <PlayCircle className="w-4 h-4 text-red-500" />;
      case 'upcoming': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'finished': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const finishedMatches = matches.filter(m => m.status === 'finished');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-200">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-gray-900" />
            {isEditingTitle ? (
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                autoFocus
                className="text-xl font-medium tracking-tight bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-900 px-1 w-64"
              />
            ) : (
              <h1 
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-medium tracking-tight cursor-pointer hover:text-gray-600 transition-colors"
                title="Click to edit"
              >
                {tournamentName || 'Tournament Live'}
              </h1>
            )}
          </div>
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors"
          >
            {isAdminOpen ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            {isAdminOpen ? 'Close Admin' : 'Manage'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className={`grid gap-12 ${isAdminOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
          
          {/* Dashboard View */}
          <div className={`space-y-12 ${isAdminOpen ? 'lg:col-span-3' : ''}`}>
            
            {/* Live Matches */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Now
              </h2>
              {liveMatches.length === 0 ? (
                <p className="text-gray-400 text-sm">No live matches at the moment.</p>
              ) : (
                <div className={`grid gap-6 ${isAdminOpen ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                  {liveMatches.map(match => (
                    <div key={match.id} className="group relative border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors bg-white shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1 text-right">
                          <h3 className="text-xl font-medium truncate">{match.team1}</h3>
                        </div>
                        <div className="px-6 flex flex-col items-center justify-center min-w-[120px]">
                          <div className="text-4xl font-bold tracking-tighter flex items-center gap-3">
                            <span>{match.score1}</span>
                            <span className="text-gray-300 font-light">-</span>
                            <span>{match.score2}</span>
                          </div>
                          <span className="text-xs font-medium text-red-500 mt-2 uppercase tracking-widest flex items-center gap-1">
                            <PlayCircle className="w-3 h-3" /> LIVE
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-medium truncate">{match.team2}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Leaderboard */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Leaderboard
              </h2>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-4">Team</th>
                        <th className="px-4 py-4 text-center">Matches Played</th>
                        <th className="px-4 py-4 text-center">Wins</th>
                        <th className="px-4 py-4 text-center">Losses</th>
                        <th className="px-4 py-4 text-center">Score For</th>
                        <th className="px-4 py-4 text-center">Score Against</th>
                        <th className="px-4 py-4 text-center">Difference</th>
                        <th className="px-6 py-4 text-right text-gray-900">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {standings.map((team, idx) => (
                        <tr key={team.name} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium flex items-center gap-3">
                            <span className="text-gray-400 w-4">{idx + 1}.</span>
                            {team.name}
                          </td>
                          <td className="px-4 py-4 text-center text-gray-600">{team.played}</td>
                          <td className="px-4 py-4 text-center text-gray-600">{team.wins}</td>
                          <td className="px-4 py-4 text-center text-gray-600">{team.losses}</td>
                          <td className="px-4 py-4 text-center text-gray-600">{team.scoreFor}</td>
                          <td className="px-4 py-4 text-center text-gray-600">{team.scoreAgainst}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium ${team.scoreDifference > 0 ? 'bg-emerald-50 text-emerald-600' : team.scoreDifference < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                              {team.scoreDifference > 0 ? '+' : ''}{team.scoreDifference}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">{team.points}</td>
                        </tr>
                      ))}
                      {standings.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No teams registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Upcoming Matches */}
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Upcoming</h2>
                <div className="space-y-3">
                  {upcomingMatches.map(match => (
                    <div key={match.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-4 text-sm font-medium w-full">
                        <div className="flex-1 flex justify-between items-center px-4">
                          <span>{match.team1}</span>
                          <span className="text-gray-300 text-xs px-2">vs</span>
                          <span>{match.team2}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {upcomingMatches.length === 0 && <p className="text-gray-400 text-sm">No upcoming matches.</p>}
                </div>
              </section>

              {/* Finished Matches */}
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Results</h2>
                <div className="space-y-3">
                  {finishedMatches.map(match => (
                    <div key={match.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                      <div className="flex-1 flex justify-between items-center text-sm font-medium">
                        <span className={match.score1 > match.score2 ? 'text-gray-900 font-bold' : 'text-gray-500'}>{match.team1}</span>
                        <div className="flex gap-3 px-4 font-bold text-gray-900 bg-gray-50 py-1 rounded-md">
                          <span>{match.score1}</span>
                          <span className="text-gray-300 font-light">-</span>
                          <span>{match.score2}</span>
                        </div>
                        <span className={match.score2 > match.score1 ? 'text-gray-900 font-bold' : 'text-gray-500'}>{match.team2}</span>
                      </div>
                    </div>
                  ))}
                  {finishedMatches.length === 0 && <p className="text-gray-400 text-sm">No results yet.</p>}
                </div>
              </section>
            </div>
          </div>

          {/* Admin Panel */}
          {isAdminOpen && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 h-fit lg:sticky lg:top-8">
              <h2 className="text-lg font-medium mb-6">Manage Matches</h2>

              {/* Teams Registration */}
              <div className="mb-8 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-gray-700">
                  <Award className="w-4 h-4"/> Registered Teams
                </h3>
                <p className="text-xs text-gray-500 mb-2">Enter team names separated by a new line (press Enter).</p>
                <textarea
                  value={registeredTeamsInput}
                  onChange={e => setRegisteredTeamsInput(e.target.value)}
                  placeholder="Team A&#10;Team B"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-all min-h-[120px] resize-y"
                />
              </div>

              {/* Tournament Settings */}
              <div className="mb-8 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-gray-700">
                  <Settings className="w-4 h-4"/> Scoring Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Points per Win</label>
                    <input 
                      type="number" 
                      value={settings.winPoints} 
                      onChange={e => setSettings({...settings, winPoints: Number(e.target.value)})} 
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Deduct per Loss</label>
                    <input 
                      type="number" 
                      value={settings.losePoints} 
                      onChange={e => setSettings({...settings, losePoints: Number(e.target.value)})} 
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-all" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Add Match Form */}
              <form onSubmit={handleAddMatch} className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Team 1</label>
                    <select
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      value={newMatch.team1}
                      onChange={e => setNewMatch({ ...newMatch, team1: e.target.value })}
                    >
                      <option value="" disabled>Select Home Team</option>
                      {parsedTeams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Team 2</label>
                    <select
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      value={newMatch.team2}
                      onChange={e => setNewMatch({ ...newMatch, team2: e.target.value })}
                    >
                      <option value="" disabled>Select Away Team</option>
                      {parsedTeams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      value={newMatch.status}
                      onChange={e => setNewMatch({ ...newMatch, status: e.target.value as MatchStatus })}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="finished">Finished</option>
                    </select>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Match
                </button>
              </form>

              {/* Manage Existing Matches */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-12">
                <h3 className="text-sm font-medium text-gray-700">Update Scores</h3>
                {matches.map(match => (
                  <div key={match.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={match.status} />
                        <span className="text-xs font-medium text-gray-500 uppercase">{match.status}</span>
                      </div>
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Match"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3 text-sm font-medium">
                      <span className="truncate w-1/3">{match.team1}</span>
                      <span className="text-gray-300 text-xs">vs</span>
                      <span className="truncate w-1/3 text-right">{match.team2}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center justify-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <input type="number" min="0" value={match.score1} onChange={e => setScore(match.id, 1, parseInt(e.target.value) || 0)} className="w-full text-center font-bold text-gray-900 bg-transparent focus:outline-none" />
                      </div>
                      <div className="flex items-center justify-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <input type="number" min="0" value={match.score2} onChange={e => setScore(match.id, 2, parseInt(e.target.value) || 0)} className="w-full text-center font-bold text-gray-900 bg-transparent focus:outline-none" />
                      </div>
                    </div>

                    {match.status === 'live' ? (
                      <button
                        onClick={() => updateStatus(match.id, 'finished')}
                        className="w-full flex items-center justify-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-2 border border-emerald-100"
                      >
                        Finish Match & Calculate <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : null}

                    <select
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all text-gray-600"
                      value={match.status}
                      onChange={e => updateStatus(match.id, e.target.value as MatchStatus)}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

