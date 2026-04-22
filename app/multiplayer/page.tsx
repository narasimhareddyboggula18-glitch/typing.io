'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { LEVELS, getLevelText } from '@/lib/levels';
import { RANKS, getRankByRating } from '@/lib/achievements';
import { soundEngine } from '@/lib/sounds';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Player {
  id: string;
  name: string;
  color: string;
  progress: number; // 0-100 %
  wpm: number;
  accuracy: number;
  finished: boolean;
  finishTime?: number;
  rank: number; // 1st, 2nd, etc.
  rating: number;
  isMe: boolean;
}

const PLAYER_COLORS = ['#00f5ff', '#b847ff', '#00ff88', '#ff8c00', '#ff3d6b', '#ffd700'];

const BOT_NAMES = ['ShadowTypist', 'KeyMaster_X', 'NeonFingers', 'VelocityPro', 'QuantumKeys', 'CryptoClacker'];

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── Race Track ─────────────────────────────────────────────────────────────────
function RaceTrack({ players }: { players: Player[] }) {
  return (
    <div className="space-y-3">
      {players.map((p, i) => (
        <motion.div
          key={p.id}
          className="race-track"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: p.color + '22', color: p.color, border: `1px solid ${p.color}44` }}>
              {i + 1}
            </div>
            <span className="font-mono font-bold text-sm" style={{ color: p.isMe ? p.color : '#f0f4ff' }}>
              {p.name} {p.isMe && <span style={{ color: '#4a5568' }}>(you)</span>}
            </span>
            <div className="ml-auto flex gap-4">
              <span className="font-mono text-sm" style={{ color: p.color }}>{p.wpm} WPM</span>
              <span className="font-mono text-xs" style={{ color: '#8892a4' }}>{p.accuracy}%</span>
              {p.finished && <span className="text-xs neon-green">✓ Finished</span>}
            </div>
          </div>

          {/* Track */}
          <div className="relative h-6 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Dashes */}
            {[20, 40, 60, 80].map(pct => (
              <div key={pct} className="absolute top-0 bottom-0 w-px"
                style={{ left: `${pct}%`, background: 'rgba(255,255,255,0.05)' }} />
            ))}
            {/* Progress fill */}
            <motion.div
              className="absolute top-0 left-0 bottom-0 rounded-full"
              style={{ background: `linear-gradient(90deg, ${p.color}40, ${p.color}80)` }}
              animate={{ width: `${p.progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
            {/* Runner emoji */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 text-sm"
              animate={{ left: `calc(${p.progress}% - 10px)` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ zIndex: 2 }}
            >
              {p.finished ? '🏁' : '🏎️'}
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Typing Input ──────────────────────────────────────────────────────────────
function RaceTyping({
  text,
  onProgress,
  onFinish,
  disabled,
}: {
  text: string;
  onProgress: (pct: number, wpm: number, accuracy: number) => void;
  onFinish: (wpm: number, accuracy: number) => void;
  disabled: boolean;
}) {
  const [typed, setTyped] = useState('');
  const [errors, setErrors] = useState(0);
  const [startTime] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!disabled) inputRef.current?.focus(); }, [disabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value;
    let errs = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== text[i]) errs++;
    }
    setErrors(errs);
    setTyped(val);

    const elapsed = (Date.now() - startTime) / 1000;
    const words = val.trim().split(/\s+/).filter(Boolean).length;
    const wpm = elapsed > 0 ? Math.round((words / elapsed) * 60) : 0;
    const acc = val.length > 0 ? Math.round(((val.length - errs) / val.length) * 100) : 100;
    const pct = Math.round((val.length / text.length) * 100);

    if (val[val.length - 1] !== text[val.length - 1]) soundEngine.playError();
    else soundEngine.playCorrect();

    onProgress(Math.min(pct, 100), wpm, acc);

    if (val.length >= text.length) onFinish(wpm, acc);
  }, [disabled, text, startTime, onProgress, onFinish]);

  const letters = text.split('').map((char, i) => {
    if (i < typed.length) return { char, state: typed[i] === char ? 'correct' : 'incorrect' };
    if (i === typed.length) return { char, state: 'current' };
    return { char, state: 'pending' };
  });

  return (
    <div onClick={() => inputRef.current?.focus()}>
      <div className="font-mono text-lg leading-relaxed mb-4 select-none" style={{ lineHeight: 2.2 }}>
        {letters.map((l, i) => (
          <span key={i} className={`letter-${l.state}`}>{l.char}</span>
        ))}
      </div>
      <div className="progress-bar mb-2">
        <div className="progress-fill" style={{ width: `${(typed.length / text.length) * 100}%` }} />
      </div>
      <input
        ref={inputRef}
        className="opacity-0 absolute w-0 h-0"
        value={typed}
        onChange={handleChange}
        disabled={disabled}
        autoComplete="off" autoCorrect="off" spellCheck={false}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Screen = 'lobby' | 'waiting' | 'countdown' | 'race' | 'results';

export default function MultiplayerPage() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [mode, setMode] = useState<'private' | 'online' | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [raceText, setRaceText] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [myRating] = useState(1200);
  const [matchmakingTime, setMatchmakingTime] = useState(0);
  const [finished, setFinished] = useState(false);
  const [myResult, setMyResult] = useState<{ wpm: number; accuracy: number; place: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myRank = getRankByRating(myRating);

  const createBotPlayers = useCallback((count: number): Player[] => {
    const me: Player = {
      id: 'me',
      name: 'You',
      color: '#00f5ff',
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      rating: myRating,
      rank: 0,
      isMe: true,
    };
    const bots = Array.from({ length: count }, (_, i): Player => ({
      id: `bot_${i}`,
      name: BOT_NAMES[i % BOT_NAMES.length],
      color: PLAYER_COLORS[i + 1] ?? '#ffffff',
      progress: 0,
      wpm: 0,
      accuracy: Math.floor(Math.random() * 10 + 88),
      finished: false,
      rating: myRating + Math.floor(Math.random() * 400 - 200),
      rank: 0,
      isMe: false,
    }));
    return [me, ...bots];
  }, [myRating]);

  // Simulate bot progress during race
  const startBotSimulation = useCallback((ps: Player[], textLen: number) => {
    const speeds = ps.filter(p => !p.isMe).map(() => 45 + Math.random() * 70); // WPM
    botIntervalRef.current = setInterval(() => {
      setPlayers(prev => {
        const updated = prev.map((p, i) => {
          if (p.isMe || p.finished) return p;
          const bi = i - 1;
          const wpmSpeed = speeds[bi] ?? 60;
          const charsPerTick = (wpmSpeed * 5) / 60 / 2; // per 500ms
          const newPct = Math.min(100, p.progress + (charsPerTick / textLen) * 100);
          return {
            ...p,
            progress: newPct,
            wpm: Math.round(wpmSpeed + (Math.random() * 10 - 5)),
            finished: newPct >= 100,
            finishTime: newPct >= 100 && !p.finished ? Date.now() : p.finishTime,
          };
        });
        // Check if all bots finished
        const allDone = updated.every(p => p.finished);
        if (allDone && botIntervalRef.current) {
          clearInterval(botIntervalRef.current);
        }
        return updated;
      });
    }, 500);
  }, []);

  const startPrivateRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    const ps = createBotPlayers(2);
    setPlayers(ps);
    setMode('private');
    setScreen('waiting');
  };

  const startMatchmaking = () => {
    setMode('online');
    setScreen('waiting');
    setMatchmakingTime(0);
    let t = 0;
    intervalRef.current = setInterval(() => {
      t++;
      setMatchmakingTime(t);
      if (t >= 4) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const ps = createBotPlayers(Math.floor(Math.random() * 3) + 2);
        setPlayers(ps);
        beginCountdown(ps);
      }
    }, 1000);
  };

  const beginCountdown = (ps: Player[]) => {
    const text = getLevelText(LEVELS[Math.floor(Math.random() * 30) + 20]);
    setRaceText(text);
    setScreen('countdown');
    let c = 3;
    setCountdown(c);
    const ci = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(ci);
        soundEngine.playRaceStart();
        setScreen('race');
        startBotSimulation(ps, text.length);
      }
    }, 1000);
  };

  const startRace = () => beginCountdown(players);

  const handleMyProgress = useCallback((pct: number, wpm: number, accuracy: number) => {
    setPlayers(prev => prev.map(p => p.isMe ? { ...p, progress: pct, wpm, accuracy } : p));
  }, []);

  const handleMyFinish = useCallback((wpm: number, accuracy: number) => {
    if (finished) return;
    setFinished(true);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    setPlayers(prev => {
      const finishedBefore = prev.filter(p => !p.isMe && p.finished).length;
      const place = finishedBefore + 1;
      const updated = prev.map(p => p.isMe ? { ...p, progress: 100, wpm, accuracy, finished: true, rank: place } : p);
      setMyResult({ wpm, accuracy, place });
      return updated;
    });
    setTimeout(() => setScreen('results'), 1500);
  }, [finished]);

  const reset = () => {
    setScreen('lobby');
    setMode(null);
    setPlayers([]);
    setFinished(false);
    setMyResult(null);
    setRaceText('');
    setCountdown(3);
    setMatchmakingTime(0);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className="min-h-screen" style={{ background: '#080b14' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href="/"><motion.button whileHover={{ x: -3 }} className="btn btn-ghost text-sm">← Back</motion.button></Link>
        <h1 className="font-display font-black text-2xl neon-purple">Multiplayer</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg text-xs font-mono font-bold"
            style={{ background: myRank.color + '20', color: myRank.color, border: `1px solid ${myRank.color}30` }}>
            {myRank.name} · {myRating}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* LOBBY */}
        {screen === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="text-6xl mb-6 float">⚡</div>
            <h2 className="font-display font-black text-4xl mb-3" style={{ color: '#f0f4ff' }}>Race to the Top</h2>
            <p className="text-sm mb-12" style={{ color: '#8892a4' }}>Compete in real-time typing races. Climb the ranks. Prove your speed.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', marginBottom: '32px' }}>
              <motion.button whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={startPrivateRoom}
                style={{
                  padding: '32px',
                  borderRadius: '20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: 'rgba(184,71,255,0.06)',
                  border: '1px solid rgba(184,71,255,0.25)',
                  backdropFilter: 'blur(20px)',
                }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔐</div>
                <h3 className="font-display font-bold text-xl mb-2 neon-purple">Play with Friends</h3>
                <p className="text-sm" style={{ color: '#8892a4' }}>Create a private room and share the code with friends</p>
              </motion.button>

              <motion.button whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={startMatchmaking}
                style={{
                  padding: '32px',
                  borderRadius: '20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: 'rgba(0,245,255,0.06)',
                  border: '1px solid rgba(0,245,255,0.25)',
                  backdropFilter: 'blur(20px)',
                }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🌐</div>
                <h3 className="font-display font-bold text-xl mb-2 neon-cyan">Play Online</h3>
                <p className="text-sm" style={{ color: '#8892a4' }}>Skill-based matchmaking against strangers</p>
              </motion.button>
            </div>

            {/* Rank ladder */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#4a5568' }}>Rank System</h3>
              <div className="flex justify-center gap-2 flex-wrap">
                {RANKS.map(r => (
                  <div key={r.name} className="text-center px-3 py-2 rounded-lg"
                    style={{ background: `${r.color}12`, border: `1px solid ${r.color}25` }}>
                    <div className="font-mono font-bold text-xs" style={{ color: r.color }}>{r.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#4a5568' }}>{r.minRating}+</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* WAITING ROOM */}
        {screen === 'waiting' && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="max-w-xl mx-auto px-4 py-16 text-center">
            {mode === 'private' ? (
              <>
                <div className="text-5xl mb-6">🔐</div>
                <h2 className="font-display font-black text-3xl mb-3" style={{ color: '#f0f4ff' }}>Room Created!</h2>
                <div className="glass rounded-2xl p-8 mb-6">
                  <p className="text-sm mb-3" style={{ color: '#8892a4' }}>Share this code with friends:</p>
                  <div className="font-mono font-black text-5xl tracking-widest neon-cyan mb-3">{roomCode}</div>
                  <p className="text-xs" style={{ color: '#4a5568' }}>{players.length}/4 players joined</p>
                </div>
                <div className="space-y-2 mb-8">
                  {players.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                      <span className="font-mono text-sm" style={{ color: p.isMe ? p.color : '#f0f4ff' }}>{p.name}</span>
                      <div className="ml-auto text-xs" style={{ color: getRankByRating(p.rating).color }}>
                        {getRankByRating(p.rating).name}
                      </div>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.04 }} className="btn btn-primary text-base px-8 py-3" onClick={startRace}>
                  🚀 Start Race
                </motion.button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-6">🔍</div>
                <h2 className="font-display font-black text-3xl mb-2" style={{ color: '#f0f4ff' }}>Finding Match…</h2>
                <p className="text-sm mb-8" style={{ color: '#8892a4' }}>Searching near your rating: {myRating}</p>
                <div className="flex justify-center mb-6">
                  <motion.div
                    className="w-16 h-16 rounded-full border-4"
                    style={{ borderColor: '#b847ff', borderTopColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <p className="font-mono text-2xl neon-purple">{matchmakingTime}s</p>
                <button className="mt-6 btn btn-ghost text-sm" onClick={reset}>Cancel</button>
              </>
            )}
          </motion.div>
        )}

        {/* COUNTDOWN */}
        {screen === 'countdown' && (
          <motion.div key="countdown" className="flex items-center justify-center min-h-[80vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="font-display font-black text-9xl gradient-text-cyan"
              >
                {countdown > 0 ? countdown : 'GO!'}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* RACE */}
        {screen === 'race' && (
          <motion.div key="race" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-4 py-8">
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#4a5568' }}>Live Positions</h3>
              <RaceTrack players={[...players].sort((a, b) => b.progress - a.progress)} />
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#4a5568' }}>Your Typing</h3>
              <RaceTyping
                text={raceText}
                onProgress={handleMyProgress}
                onFinish={handleMyFinish}
                disabled={finished}
              />
            </div>
          </motion.div>
        )}

        {/* RESULTS */}
        {screen === 'results' && myResult && (
          <motion.div key="results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto px-4 py-12 text-center">
            <motion.div className="text-7xl mb-4" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
              {myResult.place === 1 ? '🥇' : myResult.place === 2 ? '🥈' : myResult.place === 3 ? '🥉' : '🏁'}
            </motion.div>
            <h2 className="font-display font-black text-4xl mb-2 gradient-text-cyan">
              {myResult.place === 1 ? 'Victory!' : myResult.place <= 3 ? 'Podium Finish!' : 'Race Complete!'}
            </h2>
            <p className="text-sm mb-8" style={{ color: '#8892a4' }}>You finished in {myResult.place}{['st','nd','rd'][myResult.place-1]??'th'} place</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'WPM', value: myResult.wpm, color: '#00f5ff' },
                { label: 'Accuracy', value: `${myResult.accuracy}%`, color: '#00ff88' },
                { label: 'Place', value: `#${myResult.place}`, color: '#ffd700' },
              ].map(s => (
                <div key={s.label} className="glass rounded-xl p-4">
                  <div className="font-mono font-black text-3xl" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: '#4a5568' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Final leaderboard */}
            <div className="glass rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#4a5568' }}>Final Standings</h3>
              <div className="space-y-2">
                {[...players].sort((a, b) => b.progress - a.progress).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <span className="font-mono font-bold w-6 text-center" style={{ color: i === 0 ? '#ffd700' : '#4a5568' }}>
                      {i + 1}
                    </span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="font-mono text-sm flex-1" style={{ color: p.isMe ? p.color : '#f0f4ff' }}>{p.name}</span>
                    <span className="font-mono text-sm" style={{ color: p.color }}>{p.wpm} WPM</span>
                    <span className="font-mono text-xs" style={{ color: '#4a5568' }}>{p.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} className="btn btn-primary px-8" onClick={reset}>
                🔄 Play Again
              </motion.button>
              <Link href="/">
                <motion.button whileHover={{ scale: 1.05 }} className="btn btn-ghost">🏠 Home</motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
