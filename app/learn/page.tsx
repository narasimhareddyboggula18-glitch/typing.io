'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { LEARN_LESSONS, FINGER_MAP, FINGER_COLORS } from '@/lib/learnData';
import { soundEngine } from '@/lib/sounds';

const KEYBOARD_ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','='],
  ['q','w','e','r','t','y','u','i','o','p','[',']','\\'],
  ['a','s','d','f','g','h','j','k','l',';',"'"],
  ['z','x','c','v','b','n','m',',','.','/'],
  [' '],
];

function KeyboardDisplay({
  highlightKeys,
  pressedKey,
  wrongKey,
  blind,
}: {
  highlightKeys: string[];
  pressedKey: string | null;
  wrongKey: string | null;
  blind: boolean;
}) {
  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      animate={{ opacity: blind ? 0 : 1 }}
      transition={{ duration: 1.2 }}
    >
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 mb-1.5"
          style={{ paddingLeft: ri === 1 ? 24 : ri === 2 ? 36 : ri === 3 ? 52 : 0 }}>
          {row.map(key => {
            const fingerInfo = FINGER_MAP[key.toLowerCase()];
            const isHighlighted = highlightKeys.includes(key.toLowerCase());
            const isPressed = pressedKey === key;
            const isWrong = wrongKey === key;
            const color = fingerInfo?.color;

            return (
              <motion.div
                key={key}
                className="key"
                style={{
                  width: key === ' ' ? 280 : 38,
                  height: 38,
                  background: isWrong
                    ? 'rgba(255,61,107,0.3)'
                    : isPressed
                    ? `${color}33`
                    : isHighlighted
                    ? `${color}20`
                    : 'rgba(255,255,255,0.04)',
                  borderColor: isWrong
                    ? '#ff3d6b'
                    : isPressed
                    ? color
                    : isHighlighted
                    ? `${color}60`
                    : 'rgba(255,255,255,0.08)',
                  color: isHighlighted || isPressed ? color : '#4a5568',
                  boxShadow: isPressed ? `0 0 12px ${color}60` : isHighlighted ? `0 0 6px ${color}30` : 'none',
                  transition: 'all 0.1s ease',
                }}
                animate={isPressed ? { y: 2, scale: 0.93 } : { y: 0, scale: 1 }}
              >
                {key === ' ' ? '' : key.toUpperCase()}
              </motion.div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      {!blind && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {Object.entries(FINGER_COLORS).map(([finger, color]) => (
            <div key={finger} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <span className="text-xs capitalize font-mono" style={{ color: '#8892a4' }}>{finger}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function LearnPage() {
  const [lessonIdx, setLessonIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [correctFingerHint, setCorrectFingerHint] = useState<string | null>(null);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [completed, setCompleted] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('tf_learn');
      return s ? JSON.parse(s) : [];
    }
    return [];
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const lesson = LEARN_LESSONS[lessonIdx];
  const currentWord = lesson.words[wordIdx] ?? '';

  useEffect(() => { inputRef.current?.focus(); }, [lessonIdx, wordIdx]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase();
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 150);

    if (e.key === 'Backspace') return;

    const expected = currentWord[typed.length];
    if (!expected) return;

    if (key === expected) {
      soundEngine.playCorrect();
      setWrongKey(null);
      setCorrectFingerHint(null);
    } else {
      soundEngine.playError();
      setWrongKey(expected);
      const fi = FINGER_MAP[expected];
      if (fi) setCorrectFingerHint(`Use your ${fi.hand} ${fi.finger} finger for "${expected.toUpperCase()}"`);
      e.preventDefault();
    }
  }, [typed, currentWord]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTyped(val);
    if (val === currentWord) {
      if (wordIdx + 1 >= lesson.words.length) {
        setLessonComplete(true);
        soundEngine.playLevelComplete();
        const newCompleted = [...completed, lessonIdx];
        setCompleted(newCompleted);
        localStorage.setItem('tf_learn', JSON.stringify(newCompleted));
      } else {
        setWordIdx(wi => wi + 1);
        setTyped('');
        setWrongKey(null);
        setCorrectFingerHint(null);
      }
    }
  }, [currentWord, wordIdx, lesson.words.length, completed, lessonIdx]);

  const nextLesson = () => {
    if (lessonIdx + 1 < LEARN_LESSONS.length) {
      setLessonIdx(li => li + 1);
      setWordIdx(0);
      setTyped('');
      setLessonComplete(false);
      setWrongKey(null);
    }
  };

  const letters = currentWord.split('').map((char, i) => {
    if (i < typed.length) return { char, state: typed[i] === char ? 'correct' : 'incorrect' };
    if (i === typed.length) return { char, state: 'current' };
    return { char, state: 'pending' };
  });

  return (
    <div style={{ minHeight: '100vh', background: '#060912' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,9,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/">
          <motion.button whileHover={{ x: -3 }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892a4', padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>← Back</motion.button>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 24, background: 'linear-gradient(135deg, #00ff88, #00f5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Learn</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 120, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(completed.length / LEARN_LESSONS.length) * 100}%` }} transition={{ duration: 0.8 }}
              style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #00ff88, #00f5ff)' }} />
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#00ff88' }}>{completed.length}/{LEARN_LESSONS.length}</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Lesson tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 28, scrollbarWidth: 'none' }}>
          {LEARN_LESSONS.map((l, i) => {
            const isActive = i === lessonIdx;
            const isDone = completed.includes(i);
            const isLocked = i > 0 && !completed.includes(i - 1) && i !== lessonIdx;
            return (
              <motion.button key={l.id} whileHover={!isLocked ? { y: -2 } : {}} whileTap={!isLocked ? { scale: 0.97 } : {}}
                onClick={() => { if (!isLocked) { setLessonIdx(i); setWordIdx(0); setTyped(''); setLessonComplete(false); } }}
                style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 10, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.3 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap', border: `1px solid ${isActive ? '#00ff88' : isDone ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.06)'}`, background: isActive ? 'rgba(0,255,136,0.12)' : isDone ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.03)', color: isActive ? '#00ff88' : isDone ? 'rgba(0,255,136,0.7)' : '#4a5568' }}>
                {isDone ? '✓ ' : ''}{l.title}
              </motion.button>
            );
          })}
        </div>

        {/* Current lesson card */}
        <motion.div key={lessonIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '32px', marginBottom: 28, border: '1px solid rgba(255,255,255,0.06)' }}
          onClick={() => inputRef.current?.focus()}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {lesson.blind && (
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '4px 10px', borderRadius: 6, background: 'rgba(255,61,107,0.12)', color: '#ff3d6b', border: '1px solid rgba(255,61,107,0.25)', letterSpacing: 1 }}>
                🙈 BLIND MODE
              </span>
            )}
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: '#f0f4ff', margin: 0 }}>{lesson.title}</h2>
          </div>
          <p style={{ fontSize: 13, color: '#6b7a99', marginBottom: 24, lineHeight: 1.6 }}>{lesson.description}</p>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
              <motion.div animate={{ width: `${(wordIdx / lesson.words.length) * 100}%` }} transition={{ duration: 0.3 }}
                style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #00ff88, #00f5ff)', boxShadow: '0 0 8px rgba(0,255,136,0.4)' }} />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#00ff88' }}>{wordIdx}/{lesson.words.length}</span>
          </div>

          {/* Word display */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 48, letterSpacing: '0.15em', display: 'flex' }}>
              {letters.map((ltr, i) => (
                <span key={i} style={{
                  color: ltr.state === 'correct' ? '#00ff88' : ltr.state === 'incorrect' ? '#ff3d6b' : ltr.state === 'current' ? '#00f5ff' : '#2e3a50',
                  textShadow: ltr.state === 'correct' ? '0 0 10px rgba(0,255,136,0.6)' : ltr.state === 'incorrect' ? '0 0 10px rgba(255,61,107,0.7)' : ltr.state === 'current' ? '0 0 14px rgba(0,245,255,1)' : 'none',
                  borderBottom: ltr.state === 'current' ? '3px solid #00f5ff' : 'none',
                  transition: 'color 0.08s ease',
                }}>{ltr.char}</span>
              ))}
              <span style={{ display: 'inline-block', width: 2, height: '1.2em', background: '#00f5ff', marginLeft: 2, animation: 'blink 1.1s step-start infinite', verticalAlign: 'middle', boxShadow: '0 0 10px #00f5ff', borderRadius: 1 }} />
            </div>
          </div>

          {/* Finger hint */}
          <AnimatePresence>
            {correctFingerHint && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', padding: '10px 20px', borderRadius: 10, background: 'rgba(255,61,107,0.1)', color: '#ff3d6b', border: '1px solid rgba(255,61,107,0.2)', marginTop: 8 }}>
                👆 {correctFingerHint}
              </motion.div>
            )}
          </AnimatePresence>

          <input ref={inputRef} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            value={typed} onChange={handleChange} onKeyDown={handleKeyDown}
            autoComplete="off" autoCorrect="off" spellCheck={false} />
        </motion.div>

        {/* Keyboard */}
        <KeyboardDisplay
          highlightKeys={lesson.keys}
          pressedKey={pressedKey}
          wrongKey={wrongKey}
          blind={lesson.blind}
        />
      </div>

      {/* Lesson complete overlay */}
      <AnimatePresence>
        {lessonComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,18,0.92)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <motion.div initial={{ scale: 0.75, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 28, padding: '48px 40px', maxWidth: 440, width: '90%', textAlign: 'center', boxShadow: '0 0 60px rgba(0,255,136,0.1)' }}>
              <motion.div style={{ fontSize: 56, marginBottom: 16 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>🎉</motion.div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 32, background: 'linear-gradient(135deg, #00ff88, #00f5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 8px' }}>Lesson Complete!</h2>
              <p style={{ color: '#6b7a99', fontSize: 14, marginBottom: 32 }}>{lesson.title} mastered ✓</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setLessonComplete(false); setWordIdx(0); setTyped(''); }}
                  style={{ padding: '10px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                  🔁 Redo
                </motion.button>
                {lessonIdx + 1 < LEARN_LESSONS.length && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={nextLesson}
                    style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #00ff88, #00f5ff)', border: 'none', color: '#060912', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                    Next Lesson →
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
