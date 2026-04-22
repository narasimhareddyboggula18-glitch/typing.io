'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const MODES = [
  {
    id: 'practice',
    label: 'Practice',
    icon: '🎯',
    href: '/practice',
    color: '#00f5ff',
    bg: 'rgba(0,245,255,0.07)',
    border: 'rgba(0,245,255,0.25)',
    shadow: 'rgba(0,245,255,0.12)',
    description: '100 progressive levels — from home row to expert code',
    tags: ['100 Levels', 'Real-time WPM', '3-Star Ratings'],
    number: '01',
  },
  {
    id: 'multiplayer',
    label: 'Multiplayer',
    icon: '⚡',
    href: '/multiplayer',
    color: '#b847ff',
    bg: 'rgba(184,71,255,0.07)',
    border: 'rgba(184,71,255,0.25)',
    shadow: 'rgba(184,71,255,0.12)',
    description: 'Race friends or strangers in real-time typing battles',
    tags: ['Private Rooms', 'Matchmaking', 'Rank Ladder'],
    number: '02',
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: '🧠',
    href: '/learn',
    color: '#00ff88',
    bg: 'rgba(0,255,136,0.07)',
    border: 'rgba(0,255,136,0.25)',
    shadow: 'rgba(0,255,136,0.12)',
    description: 'Master finger placement and blind touch typing from scratch',
    tags: ['Finger Colors', '10 Lessons', 'Blind Mode'],
    number: '03',
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: '📊',
    href: '/stats',
    color: '#ffd700',
    bg: 'rgba(255,215,0,0.07)',
    border: 'rgba(255,215,0,0.25)',
    shadow: 'rgba(255,215,0,0.12)',
    description: 'Deep analytics, heatmaps, streaks and achievement tracking',
    tags: ['WPM Charts', 'Error Heatmap', '20 Badges'],
    number: '04',
  },
];

export default function HomePage() {
  const [hovered, setHovered] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.4 + 0.05,
    }));

    let raf: number;
    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((a, i) => particles.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 90) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,245,255,${0.05 * (1 - d / 90)})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <main style={{ background: '#060912', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,71,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100vh' }}>
        {/* LEFT — Hero */}
        <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 40px 60px 60px' }}>
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⌨️</div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg, #00f5ff, #b847ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TypeForge</span>
            <div style={{ marginLeft: 8, padding: '3px 10px', borderRadius: 99, background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#00f5ff', letterSpacing: 2 }}>BETA</div>
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 72, lineHeight: 1.0, letterSpacing: '-2px', marginBottom: 24 }}>
              <div style={{ color: '#f0f4ff' }}>Type</div>
              <div style={{ background: 'linear-gradient(135deg, #00f5ff 0%, #b847ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>faster.</div>
              <div style={{ color: '#f0f4ff' }}>Think</div>
              <div style={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff3d6b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sharper.</div>
            </div>

            <p style={{ color: '#6b7a99', fontSize: 16, lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
              The world's most immersive typing experience. 100 progressive levels, real-time multiplayer races, and AI-powered learning.
            </p>
          </motion.div>

          {/* Live stats strip */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: 32, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32 }}
          >
            {[['100', 'Levels'], ['6', 'Rank Tiers'], ['3', 'Sound Themes'], ['20', 'Achievements']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: '#00f5ff' }}>{n}</div>
                <div style={{ fontSize: 11, color: '#4a5568', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>{l.toUpperCase()}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — Mode cards */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 60px 60px 20px', gap: 12 }}>
          {MODES.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
              onHoverStart={() => setHovered(m.id)}
              onHoverEnd={() => setHovered(null)}
            >
              <Link href={m.href} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ x: -6, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    padding: '22px 28px',
                    borderRadius: 18,
                    background: hovered === m.id ? m.bg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${hovered === m.id ? m.border : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: hovered === m.id ? `0 0 40px ${m.shadow}, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Number */}
                  <div style={{ position: 'absolute', top: 12, right: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.08)', fontWeight: 700 }}>{m.number}</div>

                  {/* Icon */}
                  <motion.div
                    animate={hovered === m.id ? { scale: 1.15, rotate: [-5, 5, 0] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: 32, flexShrink: 0, width: 56, height: 56, borderRadius: 14, background: `${m.color}12`, border: `1px solid ${m.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {m.icon}
                  </motion.div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: hovered === m.id ? m.color : '#f0f4ff', marginBottom: 4, transition: 'color 0.2s' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7a99', lineHeight: 1.5, marginBottom: 10 }}>{m.description}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {m.tags.map(t => (
                        <span key={t} style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '3px 8px', borderRadius: 6, background: `${m.color}10`, color: m.color, border: `1px solid ${m.color}20`, letterSpacing: 0.5 }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <motion.div
                    animate={hovered === m.id ? { x: 0, opacity: 1 } : { x: 8, opacity: 0 }}
                    style={{ color: m.color, fontSize: 20, flexShrink: 0 }}
                  >→</motion.div>

                  {/* Shimmer */}
                  {hovered === m.id && (
                    <motion.div
                      style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent 40%, ${m.color}06 50%, transparent 60%)`, backgroundSize: '200% 100%', pointerEvents: 'none' }}
                      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          ))}

          {/* Bottom label */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ textAlign: 'center', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#2a3240', marginTop: 8, letterSpacing: 1 }}
          >
            BETTER THAN MONKEYTYPE · TYPERACER · KEYBR · COMBINED
          </motion.p>
        </div>
      </div>
    </main>
  );
}
