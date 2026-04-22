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
  const [mode, setMode] = useState<'private' | 'online' | 'join' | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
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

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError('Code must be 6 characters');
      return;
    }
    setJoinError('');
    // Simulate joining — in prod this would look up Supabase `rooms` table
    setRoomCode(code);
    const ps = createBotPlayers(2); // host + 1 other bot already in room
    setPlayers(ps);
    setMode('join');
    setScreen('waiting');
  };

  const reset = () => {
    setScreen('lobby');
    setMode(null);
    setPlayers([]);
    setFinished(false);
    setMyResult(null);
    setRaceText('');
    setCountdown(3);
    setMatchmakingTime(0);
    setJoinCode('');
    setJoinError('');
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060912' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,9,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/">
          <motion.button whileHover={{ x: -3 }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892a4', padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>← Back</motion.button>
        </Link>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 24, background: 'linear-gradient(135deg, #b847ff, #00f5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Multiplayer</h1>
        <div style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, background: `${myRank.color}18`, border: `1px solid ${myRank.color}30`, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: myRank.color }}>
          {myRank.name} · {myRating}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* LOBBY */}
        {screen === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 36, color: '#f0f4ff', margin: '0 0 8px' }}>Race to the Top</h2>
            <p style={{ color: '#6b7a99', fontSize: 14, marginBottom: 40 }}>Compete in real-time typing races. Climb the ranks. Prove your speed.</p>

            {/* 3 cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>

              {/* Create Private Room */}
              <motion.button whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startPrivateRoom}
                style={{ padding: '28px 20px', borderRadius: 18, textAlign: 'left', cursor: 'pointer', background: 'rgba(184,71,255,0.06)', border: '1px solid rgba(184,71,255,0.25)', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: '#b847ff', margin: '0 0 6px' }}>Create Room</h3>
                <p style={{ fontSize: 12, color: '#6b7a99', lineHeight: 1.5 }}>Start a private room and share the code with friends</p>
              </motion.button>

              {/* Join Room */}
              <div style={{ padding: '28px 20px', borderRadius: 18, textAlign: 'left', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.25)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🚪</div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: '#00ff88', margin: '0 0 8px' }}>Join Room</h3>
                <p style={{ fontSize: 12, color: '#6b7a99', marginBottom: 12, lineHeight: 1.5 }}>Have a code? Enter it to join a friend's room</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={joinCode}
                    onChange={e => { setJoinCode(e.target.value.toUpperCase().slice(0, 6)); setJoinError(''); }}
                    onKeyDown={e => e.key === 'Enter' && joinRoom()}
                    placeholder="ROOM CODE"
                    maxLength={6}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(0,255,136,0.08)', border: `1px solid ${joinError ? '#ff3d6b' : 'rgba(0,255,136,0.3)'}`, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, letterSpacing: 3, outline: 'none', width: '100%' }}
                  />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={joinRoom}
                    style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                    →
                  </motion.button>
                </div>
                {joinError && <p style={{ color: '#ff3d6b', fontSize: 11, marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>{joinError}</p>}
              </div>

              {/* Play Online */}
              <motion.button whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startMatchmaking}
                style={{ padding: '28px 20px', borderRadius: 18, textAlign: 'left', cursor: 'pointer', background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.25)', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🌐</div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: '#00f5ff', margin: '0 0 6px' }}>Play Online</h3>
                <p style={{ fontSize: 12, color: '#6b7a99', lineHeight: 1.5 }}>Skill-based matchmaking against real players worldwide</p>
              </motion.button>
            </div>

            {/* Rank ladder */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3a4255', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Rank System</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {RANKS.map(r => (
                  <div key={r.name} style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 10, background: `${r.color}10`, border: `1px solid ${r.color}22` }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 11, color: r.color }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: '#3a4255', marginTop: 2 }}>{r.minRating}+</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* WAITING ROOM */}
        {screen === 'waiting' && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
            {(mode === 'private' || mode === 'join') ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{mode === 'join' ? '🚪' : '🔐'}</div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, color: '#f0f4ff', margin: '0 0 24px' }}>
                  {mode === 'join' ? 'Joined Room!' : 'Room Created!'}
                </h2>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 16, padding: '28px', marginBottom: 20 }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#4a5568', marginBottom: 10 }}>
                    {mode === 'join' ? 'Room code:' : 'Share this code with friends:'}
                  </p>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 48, letterSpacing: 8, color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.6)', marginBottom: 8 }}>
                    {roomCode}
                  </div>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4a5568' }}>{players.length}/4 players in room</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {players.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: p.isMe ? p.color : '#f0f4ff', flex: 1 }}>
                        {p.name} {p.isMe && <span style={{ color: '#4a5568', fontSize: 11 }}>(you)</span>}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: getRankByRating(p.rating).color }}>
                        {getRankByRating(p.rating).name}
                      </span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={startRace}
                  style={{ padding: '14px 40px', borderRadius: 12, background: 'linear-gradient(135deg, #b847ff, #00f5ff)', border: 'none', color: '#060912', cursor: 'pointer', fontWeight: 800, fontSize: 16, fontFamily: 'Outfit, sans-serif' }}>
                  🚀 Start Race
                </motion.button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, color: '#f0f4ff', margin: '0 0 8px' }}>Finding Match…</h2>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#6b7a99', marginBottom: 32 }}>Searching near rating: {myRating}</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <motion.div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(184,71,255,0.2)', borderTop: '3px solid #b847ff' }}
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 28, color: '#b847ff', textShadow: '0 0 12px rgba(184,71,255,0.6)' }}>{matchmakingTime}s</p>
                <motion.button whileHover={{ scale: 1.03 }} onClick={reset}
                  style={{ marginTop: 24, padding: '8px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7a99', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>Cancel</motion.button>
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
