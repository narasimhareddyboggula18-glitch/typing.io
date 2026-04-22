'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from 'recharts';
import { LEVELS, TIER_COLORS } from '@/lib/levels';
import { ACHIEVEMENTS, RANKS, getRankByRating } from '@/lib/achievements';
import { FINGER_MAP } from '@/lib/learnData';

// ── Mock data generation from localStorage ──────────────────────────────────
function generateSessionData() {
  return Array.from({ length: 14 }, (_, i) => ({
    day: i === 13 ? 'Today' : `Day ${13 - i}`,
    wpm: Math.floor(Math.random() * 40 + 40),
    accuracy: Math.floor(Math.random() * 10 + 88),
  })).reverse();
}

// ── Heatmap keyboard ─────────────────────────────────────────────────────────
const KEYBOARD_ROWS_FLAT = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l',';'],
  ['z','x','c','v','b','n','m'],
];

function KeyHeatmap({ mistakes }: { mistakes: Record<string, number> }) {
  const maxCount = Math.max(1, ...Object.values(mistakes));
  const getClass = (key: string) => {
    const c = mistakes[key] ?? 0;
    const ratio = c / maxCount;
    if (ratio === 0) return 'heatmap-key-none';
    if (ratio < 0.3) return 'heatmap-key-low';
    if (ratio < 0.7) return 'heatmap-key-mid';
    return 'heatmap-key-high';
  };

  return (
    <div className="space-y-1.5">
      {KEYBOARD_ROWS_FLAT.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1.5"
          style={{ paddingLeft: ri === 1 ? 12 : ri === 2 ? 28 : 0 }}>
          {row.map(key => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.15, y: -2 }}
              title={`${key.toUpperCase()}: ${mistakes[key] ?? 0} errors`}
              className={`key ${getClass(key)}`}
              style={{ width: 36, height: 36, fontSize: '0.65rem', cursor: 'default' }}
            >
              {key.toUpperCase()}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Streak calendar ───────────────────────────────────────────────────────────
function StreakCalendar({ activeDays }: { activeDays: Set<string> }) {
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.getDate(), active: activeDays.has(key) };
  });

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {['S','M','T','W','T','F','S'].map(d => (
        <div key={d} className="text-center text-xs font-mono" style={{ color: '#4a5568' }}>{d}</div>
      ))}
      {days.map(d => (
        <motion.div
          key={d.key}
          whileHover={{ scale: 1.2 }}
          title={d.key}
          className="aspect-square rounded-md flex items-center justify-center text-xs font-mono"
          style={{
            background: d.active ? 'rgba(0,245,255,0.2)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${d.active ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.04)'}`,
            color: d.active ? '#00f5ff' : '#4a5568',
            boxShadow: d.active ? '0 0 6px rgba(0,245,255,0.2)' : 'none',
          }}
        >
          {d.label}
        </motion.div>
      ))}
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 rounded-xl text-xs font-mono">
      <div style={{ color: '#8892a4' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}{p.dataKey === 'accuracy' ? '%' : ' WPM'}</div>
      ))}
    </div>
  );
};

// ── Main Stats page ───────────────────────────────────────────────────────────
export default function StatsPage() {
  const [progress, setProgress] = useState<Record<number, { stars: number; wpm: number; accuracy: number }>>({});
  const [sessionData] = useState(generateSessionData);
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'achievements'>('overview');
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('tf_progress');
    if (stored) setProgress(JSON.parse(stored));
    // Demo unlocked achievements
    setUnlockedAchievements(['first_keystroke', 'speed_demon_30', 'level_10']);
  }, []);

  const completedLevels = Object.keys(progress).length;
  const bestWpm = Object.values(progress).reduce((max, p) => Math.max(max, p.wpm), 0);
  const avgWpm = completedLevels > 0
    ? Math.round(Object.values(progress).reduce((sum, p) => sum + p.wpm, 0) / completedLevels)
    : 0;
  const avgAccuracy = completedLevels > 0
    ? Math.round(Object.values(progress).reduce((sum, p) => sum + p.accuracy, 0) / completedLevels)
    : 0;
  const totalStars = Object.values(progress).reduce((sum, p) => sum + p.stars, 0);
  const xp = completedLevels * 150 + totalStars * 25;
  const rating = 800 + completedLevels * 10 + Math.max(0, bestWpm - 30) * 3;
  const rank = getRankByRating(rating);

  // Mock mistake data
  const mistakes: Record<string, number> = {
    z: 12, x: 8, q: 9, p: 6, y: 4, b: 7, v: 5, c: 2, m: 3, n: 1,
    ';': 11, "'": 9, w: 3, f: 2,
  };

  // Mock active days
  const activeDays = new Set([
    ...Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    }),
  ]);

  // Radar data
  const radarData = [
    { skill: 'Speed', value: Math.min(100, bestWpm) },
    { skill: 'Accuracy', value: avgAccuracy || 85 },
    { skill: 'Consistency', value: 75 },
    { skill: 'Levels', value: Math.round((completedLevels / 100) * 100) },
    { skill: 'Streak', value: 70 },
  ];

  const TABS = ['overview', 'heatmap', 'achievements'] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#060912' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,9,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/">
          <motion.button whileHover={{ x: -3 }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892a4', padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>← Back</motion.button>
        </Link>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 24, background: 'linear-gradient(135deg, #ffd700, #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Stats</h1>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Top hero row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Best WPM', value: bestWpm || '—', color: '#00f5ff', icon: '⚡' },
            { label: 'Avg WPM', value: avgWpm || '—', color: '#b847ff', icon: '📈' },
            { label: 'Accuracy', value: avgAccuracy ? `${avgAccuracy}%` : '—', color: '#00ff88', icon: '🎯' },
            { label: 'Levels', value: `${completedLevels}/100`, color: '#ffd700', icon: '🏆' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '20px', border: `1px solid ${s.color}18`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 32, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3a4255', marginTop: 6, letterSpacing: 1, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}40, transparent)` }} />
            </motion.div>
          ))}
        </div>

        {/* Rank + XP card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderRadius: 16, background: `${rank.color}08`, border: `1px solid ${rank.color}25`, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `${rank.color}20`, border: `2px solid ${rank.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 22, color: rank.color, flexShrink: 0 }}>
            {rank.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: rank.color }}>{rank.name}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#4a5568' }}>{rating} rating</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', maxWidth: 280 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${((rating - rank.minRating) / (Math.min(rank.maxRating, 9999) - rank.minRating + 1)) * 100}%` }} transition={{ duration: 1.2 }}
                style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${rank.color}, ${rank.color}66)`, boxShadow: `0 0 8px ${rank.color}40` }} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 30, color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.6)' }}>{xp}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3a4255', letterSpacing: 1, marginTop: 4 }}>TOTAL XP</div>
          </div>
        </motion.div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {TABS.map(tab => (
            <motion.button key={tab} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 20px', borderRadius: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', border: `1px solid ${activeTab === tab ? 'rgba(0,245,255,0.35)' : 'rgba(255,255,255,0.06)'}`, background: activeTab === tab ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.03)', color: activeTab === tab ? '#00f5ff' : '#6b7a99', transition: 'all 0.2s' }}>
              {tab}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* WPM chart */}
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#4a5568' }}>WPM Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={sessionData}>
                    <defs>
                      <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <YAxis tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="wpm" name="WPM" stroke="#00f5ff" strokeWidth={2} fill="url(#wpmGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Skill radar */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#4a5568' }}>Skill Profile</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#8892a4', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <Radar name="Skills" dataKey="value" stroke="#b847ff" fill="#b847ff" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Accuracy chart */}
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#4a5568' }}>Accuracy Trend</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={sessionData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <YAxis domain={[80, 100]} tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#00ff88" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Streak calendar */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#4a5568' }}>
                  🔥 Practice Streak
                </h3>
                <StreakCalendar activeDays={activeDays} />
                <div className="mt-4 text-center">
                  <span className="font-mono font-black text-2xl neon-cyan">7</span>
                  <span className="font-mono text-xs ml-2" style={{ color: '#4a5568' }}>day streak</span>
                </div>
              </div>

              {/* Level tier progress */}
              <div className="lg:col-span-3 glass rounded-2xl p-6">
                <h3 className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: '#4a5568' }}>Tier Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['basic', 'intermediate', 'upper', 'expert'] as const).map(tier => {
                    const tierLevels = LEVELS.filter(l => l.tier === tier);
                    const done = tierLevels.filter(l => progress[l.id]).length;
                    const color = TIER_COLORS[tier];
                    return (
                      <div key={tier} className="text-center">
                        <div className="font-mono font-bold text-sm mb-2 capitalize" style={{ color }}>{tier}</div>
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                            <motion.circle
                              cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${(done / tierLevels.length) * 87.96} 87.96`}
                              initial={{ strokeDasharray: '0 87.96' }}
                              animate={{ strokeDasharray: `${(done / tierLevels.length) * 87.96} 87.96` }}
                              transition={{ duration: 1.2, ease: 'easeOut' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm" style={{ color }}>
                            {done}
                          </div>
                        </div>
                        <div className="text-xs font-mono" style={{ color: '#4a5568' }}>{done}/{tierLevels.length}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* HEATMAP */}
          {activeTab === 'heatmap' && (
            <motion.div key="heatmap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-8">
                <h3 className="font-mono text-xs uppercase tracking-widest mb-6" style={{ color: '#4a5568' }}>Error Heatmap</h3>
                <KeyHeatmap mistakes={mistakes} />
                <div className="flex items-center justify-center gap-4 mt-6">
                  {[
                    { label: 'No errors', cls: 'heatmap-key-none' },
                    { label: 'Few', cls: 'heatmap-key-low' },
                    { label: 'Some', cls: 'heatmap-key-mid' },
                    { label: 'Many', cls: 'heatmap-key-high' },
                  ].map(({ label, cls }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`key ${cls}`} style={{ width: 14, height: 14, borderRadius: 3 }} />
                      <span className="text-xs font-mono" style={{ color: '#4a5568' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-8">
                <h3 className="font-mono text-xs uppercase tracking-widest mb-6" style={{ color: '#4a5568' }}>Top Problem Keys</h3>
                <div className="space-y-3">
                  {Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, count]) => {
                    const fi = FINGER_MAP[key];
                    const maxErr = Math.max(...Object.values(mistakes));
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className="key heatmap-key-high w-8 h-8 flex-shrink-0 text-xs">{key.toUpperCase()}</div>
                        <div className="flex-1">
                          <div className="progress-bar">
                            <motion.div
                              className="progress-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / maxErr) * 100}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              style={{ background: `linear-gradient(90deg, #ff3d6b, #ff8c00)` }}
                            />
                          </div>
                        </div>
                        <span className="font-mono text-sm" style={{ color: '#ff3d6b' }}>{count}</span>
                        {fi && (
                          <span className="text-xs font-mono" style={{ color: fi.color }}>{fi.finger}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ACHIEVEMENTS.map((a, i) => {
                  const unlocked = unlockedAchievements.includes(a.id);
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={`achievement-badge ${unlocked ? 'unlocked' : ''}`}
                      style={{ opacity: unlocked ? 1 : 0.4 }}
                    >
                      <div className="text-4xl mb-3" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>
                        {a.icon}
                      </div>
                      <h4 className="font-mono font-bold text-sm mb-1" style={{ color: unlocked ? '#f0f4ff' : '#4a5568' }}>
                        {a.name}
                      </h4>
                      <p className="text-xs leading-relaxed" style={{ color: '#4a5568' }}>{a.description}</p>
                      <div className="mt-3 text-xs font-mono font-bold" style={{ color: unlocked ? '#ffd700' : '#4a5568' }}>
                        +{a.xp} XP {unlocked ? '✓' : '🔒'}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
