'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { LEVELS, getStars, TIER_COLORS, TIER_LABELS, getLevelText } from '@/lib/levels';
import { soundEngine } from '@/lib/sounds';
import dynamic from 'next/dynamic';

const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false });

function useLocalProgress() {
  const [progress, setProgress] = useState<Record<number, { stars: number; wpm: number; accuracy: number }>>({});
  useEffect(() => {
    const stored = localStorage.getItem('tf_progress');
    if (stored) setProgress(JSON.parse(stored));
  }, []);
  const save = (levelId: number, data: { stars: number; wpm: number; accuracy: number }) => {
    setProgress(prev => {
      const updated = { ...prev };
      if (!updated[levelId] || data.stars > updated[levelId].stars) updated[levelId] = data;
      localStorage.setItem('tf_progress', JSON.stringify(updated));
      return updated;
    });
  };
  return { progress, save };
}

// ── Level Grid ────────────────────────────────────────────────────────────────
function LevelGrid({ onSelect }: { onSelect: (id: number) => void }) {
  const { progress } = useLocalProgress();
  const maxUnlocked = Math.max(1, ...Object.keys(progress).map(Number)) + 1;
  const completedCount = Object.keys(progress).length;

  return (
    <div style={{ minHeight: '100vh', background: '#060912', padding: '0' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,9,18,0.9)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link href="/">
          <motion.button whileHover={{ x: -3 }} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#8892a4', padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
          }}>← Back</motion.button>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, background: 'linear-gradient(135deg, #00f5ff, #b847ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Practice</h1>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#4a5568' }}>{completedCount}/100 completed</span>
          </div>
        </div>
        {/* Compact progress bar */}
        <div style={{ width: 200, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <motion.div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #00f5ff, #b847ff)' }}
            initial={{ width: 0 }} animate={{ width: `${completedCount}%` }} transition={{ duration: 1 }} />
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#00f5ff' }}>{completedCount}%</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {(['basic', 'intermediate', 'upper', 'expert'] as const).map((tier, ti) => {
          const tierLevels = LEVELS.filter(l => l.tier === tier);
          const color = TIER_COLORS[tier];
          const tierDone = tierLevels.filter(l => progress[l.id]).length;

          return (
            <motion.div key={tier} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ti * 0.1 }} style={{ marginBottom: 40 }}>
              {/* Tier header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 11, color, letterSpacing: 3, textTransform: 'uppercase' }}>
                  {TIER_LABELS[tier]}
                </span>
                <div style={{ flex: 1, height: 1, background: `${color}20` }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4a5568' }}>
                  {tierDone}/{tierLevels.length} · L{tierLevels[0].id}–L{tierLevels[tierLevels.length - 1].id}
                </span>
              </div>

              {/* Level cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 8 }}>
                {tierLevels.map(level => {
                  const done = progress[level.id];
                  const locked = level.id > maxUnlocked;
                  const isCurrent = level.id === Math.min(maxUnlocked, 100) && !done;

                  return (
                    <motion.button key={level.id}
                      onClick={() => !locked && onSelect(level.id)}
                      whileHover={!locked ? { y: -4, scale: 1.06 } : {}}
                      whileTap={!locked ? { scale: 0.96 } : {}}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 12,
                        border: `1px solid ${done ? `${color}40` : isCurrent ? `${color}80` : 'rgba(255,255,255,0.05)'}`,
                        background: done ? `${color}08` : isCurrent ? `${color}12` : 'rgba(255,255,255,0.02)',
                        boxShadow: isCurrent ? `0 0 16px ${color}25` : 'none',
                        cursor: locked ? 'not-allowed' : 'pointer',
                        opacity: locked ? 0.3 : 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                        transition: 'all 0.2s ease', padding: 6,
                      }}
                    >
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: done ? color : isCurrent ? color : '#6b7a99' }}>
                        {level.id}
                      </span>
                      {done ? (
                        <span style={{ fontSize: 8, color: '#ffd700', letterSpacing: -1 }}>{'★'.repeat(done.stars)}{'☆'.repeat(3 - done.stars)}</span>
                      ) : locked ? (
                        <span style={{ fontSize: 9 }}>🔒</span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Typing Arena ──────────────────────────────────────────────────────────────
type LetterState = 'correct' | 'incorrect' | 'current' | 'pending';

function TypingArena({ levelId, onBack }: { levelId: number; onBack: () => void }) {
  const level = LEVELS.find(l => l.id === levelId)!;
  const { progress, save } = useLocalProgress();

  const [text, setText] = useState(() => getLevelText(level));
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stars, setStars] = useState(0);
  const [soundTheme, setSoundTheme] = useState<'mechanical' | 'soft' | 'click'>('mechanical');
  const [soundOn, setSoundOn] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => {
        const s = (Date.now() - startTime) / 1000;
        setElapsed(s);
        const words = typed.trim().split(/\s+/).filter(Boolean).length;
        setWpm(Math.round((words / s) * 60));
      }, 300);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, finished, startTime, typed]);

  useEffect(() => {
    soundEngine.setEnabled(soundOn);
    soundEngine.setTheme(soundTheme);
  }, [soundOn, soundTheme]);

  const handleKey = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (finished) return;
    const val = e.target.value;
    if (!started && val.length > 0) { setStarted(true); setStartTime(Date.now()); }

    let newErrors = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== text[i]) newErrors++;
    }
    setErrors(newErrors);
    const acc = val.length > 0 ? Math.round(((val.length - newErrors) / val.length) * 100) : 100;
    setAccuracy(acc);

    if (val.length > typed.length) {
      const last = val[val.length - 1];
      const expected = text[val.length - 1];
      if (last === expected) soundEngine.playCorrect();
      else soundEngine.playError();
    }

    setTyped(val);

    if (val.length >= text.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      const finalElapsed = (Date.now() - startTime) / 1000;
      const words = text.trim().split(/\s+/).length;
      const finalWpm = Math.round((words / finalElapsed) * 60);
      const s = getStars(finalWpm, acc, level);
      setStars(s);
      setFinished(true);
      if (s > 0) { soundEngine.playLevelComplete(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 5000); }
      else soundEngine.playLevelFail();
      if (s > 0) save(levelId, { stars: s, wpm: finalWpm, accuracy: acc });
    }
  }, [finished, started, text, typed, level, levelId, save, startTime]);

  const letters = text.split('').map((char, i): { char: string; state: LetterState } => {
    if (i < typed.length) return { char, state: typed[i] === char ? 'correct' : 'incorrect' };
    if (i === typed.length) return { char, state: 'current' };
    return { char, state: 'pending' };
  });

  const pct = (typed.length / text.length) * 100;
  const tierColor = TIER_COLORS[level.tier];
  const prevBest = progress[levelId];

  const reset = () => { setTyped(''); setFinished(false); setStarted(false); setElapsed(0); setWpm(0); setAccuracy(100); setErrors(0); setText(getLevelText(level)); };

  return (
    <div style={{ minHeight: '100vh', background: '#060912', display: 'flex', flexDirection: 'column' }}
      onClick={() => inputRef.current?.focus()}>
      {showConfetti && <ReactConfetti numberOfPieces={300} recycle={false} colors={['#00f5ff', '#b847ff', '#00ff88', '#ffd700', '#ff3d6b']} />}

      {/* Top navbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(6,9,18,0.8)', backdropFilter: 'blur(20px)',
      }}>
        <motion.button whileHover={{ x: -3 }} onClick={onBack} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#8892a4', padding: '7px 14px', borderRadius: 9, cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
        }}>← Levels</motion.button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#4a5568' }}>Level {levelId}</span>
          <div style={{ padding: '4px 10px', borderRadius: 6, background: `${tierColor}15`, border: `1px solid ${tierColor}30`, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: tierColor }}>
            {TIER_LABELS[level.tier]}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select value={soundTheme} onChange={e => setSoundTheme(e.target.value as any)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892a4', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
            <option value="mechanical">⌨️ Mechanical</option>
            <option value="soft">🎵 Soft</option>
            <option value="click">🖱️ Click</option>
          </select>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSoundOn(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
            {soundOn ? '🔊' : '🔇'}
          </motion.button>
        </div>
      </div>

      {/* Stats bar — REDESIGNED */}
      <div style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '20px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { label: 'WPM', value: started ? wpm : '—', color: '#00f5ff', icon: '⚡' },
            { label: 'ACCURACY', value: started ? `${accuracy}%` : '—', color: '#00ff88', icon: '🎯' },
            { label: 'ERRORS', value: started ? errors : '—', color: errors > 0 ? '#ff3d6b' : '#4a5568', icon: '✗' },
            { label: 'TIME', value: started ? `${elapsed.toFixed(1)}s` : '0.0s', color: '#b847ff', icon: '⏱' },
            { label: 'GOAL', value: `${level.minWpm}+`, color: '#ffd700', icon: '🏆' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 12px', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#3a4255', marginBottom: 6, letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 24, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ maxWidth: 800, margin: '16px auto 0', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
          <motion.div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${tierColor}, ${tierColor}88)`, boxShadow: `0 0 8px ${tierColor}50` }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.1 }} />
        </div>
      </div>

      {/* Typing area — full centred */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ width: '100%', maxWidth: 860 }}>
          {!started && (
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ textAlign: 'center', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#3a4255', letterSpacing: 2 }}>START TYPING TO BEGIN</span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
            </motion.div>
          )}

          {/* Word display */}
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, lineHeight: 2.2, letterSpacing: '0.03em', userSelect: 'none', wordBreak: 'break-all' }}>
            {letters.map((l, i) => (
              <motion.span key={i}
                style={{
                  color: l.state === 'correct' ? '#00ff88' : l.state === 'incorrect' ? '#ff3d6b' : l.state === 'current' ? '#00f5ff' : '#2e3a50',
                  textShadow: l.state === 'correct' ? '0 0 8px rgba(0,255,136,0.5)' : l.state === 'incorrect' ? '0 0 8px rgba(255,61,107,0.6)' : l.state === 'current' ? '0 0 12px rgba(0,245,255,0.9)' : 'none',
                  borderBottom: l.state === 'current' ? '2px solid #00f5ff' : l.state === 'incorrect' ? '2px solid #ff3d6b55' : 'none',
                  background: l.state === 'incorrect' ? 'rgba(255,61,107,0.08)' : 'none',
                  borderRadius: l.state === 'incorrect' ? 2 : 0,
                  transition: 'color 0.08s ease, text-shadow 0.08s ease',
                }}
                animate={l.state === 'incorrect' ? { x: [0, -3, 3, -1, 0] } : {}}
                transition={{ duration: 0.15 }}
              >
                {l.char}
              </motion.span>
            ))}
          </div>

          <input ref={inputRef} value={typed} onChange={handleKey}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            autoComplete="off" autoCorrect="off" spellCheck={false} />
        </div>
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {finished && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,18,0.92)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <motion.div initial={{ scale: 0.7, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${stars > 0 ? 'rgba(0,245,255,0.25)' : 'rgba(255,61,107,0.25)'}`, borderRadius: 28, padding: '48px 40px', maxWidth: 480, width: '90%', textAlign: 'center', boxShadow: stars > 0 ? '0 0 60px rgba(0,245,255,0.1)' : '0 0 60px rgba(255,61,107,0.1)' }}>

              <motion.div style={{ fontSize: 60, marginBottom: 16 }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.6 }}>
                {stars > 0 ? '🏆' : '😤'}
              </motion.div>

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 36, margin: '0 0 8px', background: stars > 0 ? 'linear-gradient(135deg, #00f5ff, #b847ff)' : 'linear-gradient(135deg, #ff3d6b, #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stars > 0 ? 'Level Clear!' : 'Try Again!'}
              </h2>

              {stars === 0 && (
                <p style={{ color: '#6b7a99', fontSize: 14, marginBottom: 8 }}>Need {level.minWpm} WPM & {level.minAccuracy}% accuracy</p>
              )}

              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '20px 0' }}>
                {[1, 2, 3].map(s => (
                  <motion.span key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + s * 0.15, type: 'spring' }}
                    style={{ fontSize: 36, color: s <= stars ? '#ffd700' : '#1e2530', filter: s <= stars ? 'drop-shadow(0 0 6px #ffd700)' : 'none' }}>
                    ★
                  </motion.span>
                ))}
              </div>

              {/* Result stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '20px 0 28px' }}>
                {[
                  { label: 'WPM', value: wpm, color: '#00f5ff' },
                  { label: 'ACC', value: `${accuracy}%`, color: '#00ff88' },
                  { label: 'ERR', value: errors, color: errors > 0 ? '#ff3d6b' : '#00ff88' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 28, color: s.color }}>{s.value}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3a4255', marginTop: 4, letterSpacing: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {prevBest && <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#3a4255', marginBottom: 20 }}>Best: {prevBest.wpm} WPM · {prevBest.accuracy}%</p>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={reset}
                  style={{ padding: '10px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                  🔁 Retry
                </motion.button>
                {stars > 0 && levelId < 100 && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => { reset(); onBack(); }}
                    style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #00f5ff, #b847ff)', border: 'none', color: '#060912', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                    Next Level →
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={onBack}
                  style={{ padding: '10px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                  📋 Levels
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PracticePage() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  return (
    <AnimatePresence mode="wait">
      {selectedLevel === null ? (
        <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
          <LevelGrid onSelect={setSelectedLevel} />
        </motion.div>
      ) : (
        <motion.div key="arena" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
          <TypingArena levelId={selectedLevel} onBack={() => setSelectedLevel(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
