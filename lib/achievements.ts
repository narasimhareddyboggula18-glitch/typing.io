export const ACHIEVEMENTS = [
  { id: 'first_keystroke', name: 'First Keystroke', icon: '⌨️', description: 'Type your first character', xp: 10 },
  { id: 'speed_demon_30', name: 'Speed Demon', icon: '⚡', description: 'Reach 30 WPM', xp: 50 },
  { id: 'speed_demon_60', name: 'Lightning Fingers', icon: '🌩️', description: 'Reach 60 WPM', xp: 100 },
  { id: 'speed_demon_100', name: 'Centurion', icon: '💯', description: 'Reach 100 WPM', xp: 250 },
  { id: 'speed_demon_150', name: 'Supersonic', icon: '🚀', description: 'Reach 150 WPM', xp: 500 },
  { id: 'perfectionist', name: 'Perfectionist', icon: '💎', description: 'Complete a level with 100% accuracy', xp: 200 },
  { id: 'streak_3', name: 'On a Roll', icon: '🔥', description: '3-day practice streak', xp: 75 },
  { id: 'streak_7', name: 'Week Warrior', icon: '🗓️', description: '7-day practice streak', xp: 150 },
  { id: 'streak_30', name: 'Monthly Master', icon: '🏆', description: '30-day practice streak', xp: 500 },
  { id: 'level_10', name: 'Rising Star', icon: '⭐', description: 'Complete 10 levels', xp: 100 },
  { id: 'level_25', name: 'Dedicated', icon: '🎯', description: 'Complete 25 levels', xp: 200 },
  { id: 'level_50', name: 'Halfway Hero', icon: '🦸', description: 'Complete 50 levels', xp: 400 },
  { id: 'level_100', name: 'TypeForge Master', icon: '👑', description: 'Complete all 100 levels', xp: 1000 },
  { id: 'multiplayer_win', name: 'Race Winner', icon: '🏁', description: 'Win your first multiplayer race', xp: 150 },
  { id: 'multiplayer_10', name: 'Competitive', icon: '🥊', description: 'Play 10 multiplayer races', xp: 200 },
  { id: 'no_errors', name: 'Ghost Fingers', icon: '👻', description: 'Complete a session with 0 errors', xp: 300 },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', description: 'Practice after midnight', xp: 50 },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', description: 'Practice before 7am', xp: 50 },
  { id: 'marathon', name: 'Marathon', icon: '🏃', description: 'Type for 60 minutes total', xp: 200 },
  { id: 'wordsmith', name: 'Wordsmith', icon: '📝', description: 'Type 10,000 words total', xp: 300 },
];

export const RANKS = [
  { name: 'Bronze', minRating: 0, maxRating: 999, color: '#cd7f32', gradient: 'from-amber-700 to-amber-900' },
  { name: 'Silver', minRating: 1000, maxRating: 1499, color: '#c0c0c0', gradient: 'from-gray-400 to-gray-600' },
  { name: 'Gold', minRating: 1500, maxRating: 1999, color: '#ffd700', gradient: 'from-yellow-400 to-yellow-600' },
  { name: 'Platinum', minRating: 2000, maxRating: 2499, color: '#e5e4e2', gradient: 'from-slate-300 to-slate-500' },
  { name: 'Diamond', minRating: 2500, maxRating: 2999, color: '#00f5ff', gradient: 'from-cyan-400 to-purple-500' },
  { name: 'Master', minRating: 3000, maxRating: Infinity, color: '#ff3d6b', gradient: 'from-red-400 via-purple-500 to-cyan-400' },
];

export function getRankByRating(rating: number) {
  return RANKS.find(r => rating >= r.minRating && rating <= r.maxRating) || RANKS[0];
}

export function getRatingChange(won: boolean, myRating: number, opponentRating: number): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  const actual = won ? 1 : 0;
  return Math.round(K * (actual - expected));
}
