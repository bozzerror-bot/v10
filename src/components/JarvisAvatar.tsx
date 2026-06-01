import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────
   Jarvis-Style Holographic Orb Avatar
   Alex V9 AI Trading Dashboard — Centerpiece
   ───────────────────────────────────────────── */

export interface JarvisAvatarProps {
  mood: string; // 'Bullish' | 'Bearish' | 'Neutral' | 'analyzing' | etc.
  stressLevel: number; // 0-10
  isRunning: boolean; // whether trading is active
  size?: number; // pixel size, default 120
}

/** Mood color configuration */
interface MoodConfig {
  color: string;
  glow: string;
  glowDim: string;
  gradient: [string, string];
  label: string;
}

function getMoodConfig(mood: string): MoodConfig {
  const lower = mood.toLowerCase();
  if (lower.includes('bull')) {
    return {
      color: '#22c55e',
      glow: 'rgba(34,197,94,0.5)',
      glowDim: 'rgba(34,197,94,0.2)',
      gradient: ['#22c55e', '#16a34a'],
      label: 'Bullish',
    };
  }
  if (lower.includes('bear')) {
    return {
      color: '#ef4444',
      glow: 'rgba(239,68,68,0.5)',
      glowDim: 'rgba(239,68,68,0.2)',
      gradient: ['#ef4444', '#dc2626'],
      label: 'Bearish',
    };
  }
  if (lower.includes('analyz')) {
    return {
      color: '#06b6d4',
      glow: 'rgba(6,182,212,0.5)',
      glowDim: 'rgba(6,182,212,0.2)',
      gradient: ['#06b6d4', '#0891b2'],
      label: 'Analyzing',
    };
  }
  return {
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.5)',
    glowDim: 'rgba(59,130,246,0.2)',
    gradient: ['#3b82f6', '#2563eb'],
    label: 'Neutral',
  };
}

/** Generate orbiting particle configs */
interface ParticleConfig {
  id: number;
  size: number;
  radius: number;
  duration: number;
  delay: number;
  opacity: number;
}

function generateParticles(orbSize: number): ParticleConfig[] {
  const baseR = orbSize / 2;
  return [
    { id: 1, size: 3, radius: baseR + 12, duration: 2.5, delay: 0, opacity: 0.8 },
    { id: 2, size: 2, radius: baseR + 20, duration: 3.5, delay: 0.4, opacity: 0.6 },
    { id: 3, size: 2.5, radius: baseR + 8, duration: 2, delay: 0.8, opacity: 0.7 },
    { id: 4, size: 2, radius: baseR + 28, duration: 4.5, delay: 1.2, opacity: 0.5 },
    { id: 5, size: 3, radius: baseR + 18, duration: 3, delay: 1.6, opacity: 0.6 },
    { id: 6, size: 2, radius: baseR + 24, duration: 5, delay: 2, opacity: 0.4 },
    { id: 7, size: 2.5, radius: baseR + 14, duration: 2.8, delay: 0.2, opacity: 0.7 },
    { id: 8, size: 2, radius: baseR + 32, duration: 6, delay: 2.5, opacity: 0.35 },
  ];
}

/** Sound wave bar config */
interface WaveBarConfig {
  id: number;
  delay: number;
  heightPct: number;
}

function generateWaveBars(): WaveBarConfig[] {
  return [
    { id: 1, delay: 0, heightPct: 70 },
    { id: 2, delay: 0.15, heightPct: 90 },
    { id: 3, delay: 0.3, heightPct: 100 },
    { id: 4, delay: 0.45, heightPct: 85 },
    { id: 5, delay: 0.6, heightPct: 60 },
  ];
}

/** ─── SVG Stress Arc ─── */
function StressArc({
  size,
  stressLevel,
  color,
}: {
  size: number;
  stressLevel: number;
  color: string;
}) {
  const radius = (size / 2) + 6;
  const circumference = Math.PI * radius;
  const maxDash = circumference;
  const dashOffset = maxDash - (Math.min(stressLevel, 10) / 10) * maxDash;

  return (
    <svg
      width={size + 16}
      height={size + 16}
      viewBox={`0 0 ${size + 16} ${size + 16}`}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-90deg)',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {/* Background track */}
      <circle
        cx={(size + 16) / 2}
        cy={(size + 16) / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeLinecap="round"
      />
      {/* Stress fill */}
      <motion.circle
        cx={(size + 16) / 2}
        cy={(size + 16) / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        initial={false}
        animate={{ strokeDashoffset: dashOffset, stroke: color }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ opacity: 0.8 }}
      />
    </svg>
  );
}

/** ─── Main JarvisAvatar Component ─── */
export default function JarvisAvatar({
  mood,
  stressLevel,
  isRunning,
  size = 120,
}: JarvisAvatarProps) {
  const moodConfig = useMemo(() => getMoodConfig(mood), [mood]);
  const particles = useMemo(() => generateParticles(size), [size]);
  const waveBars = useMemo(() => generateWaveBars(), []);

  const orbRadius = size / 2;
  const containerSize = size + 80; // Extra space for rings & particles

  return (
    <div
      className="jarvis-avatar-container"
      style={{
        width: containerSize,
        height: containerSize + 32, // Extra for label
      }}
    >
      {/* ── Outer glow pulse wrapper ── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 40,
          height: size + 40,
          filter: 'blur(20px)',
          zIndex: 0,
        }}
        animate={{
          backgroundColor: isRunning ? moodConfig.color : 'rgba(0,0,0,0)',
          opacity: isRunning ? [0.15, 0.3, 0.15] : 0,
          scale: isRunning ? [1, 1.15, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ── Ring 1: Dashed, slow clockwise ── */}
      <motion.div
        className="jarvis-ring jarvis-ring-dashed"
        style={{
          width: size + 36,
          height: size + 36,
          zIndex: 1,
        }}
        animate={{
          borderColor: moodConfig.color,
          rotate: 360,
        }}
        transition={{
          borderColor: { duration: 0.8, ease: 'easeInOut' },
          rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
        }}
        initial={false}
      />

      {/* ── Ring 2: Dotted, counter-clockwise ── */}
      <motion.div
        className="jarvis-ring jarvis-ring-dotted"
        style={{
          width: size + 20,
          height: size + 20,
          opacity: 0.35,
          zIndex: 1,
        }}
        animate={{
          borderColor: moodConfig.color,
          rotate: -360,
        }}
        transition={{
          borderColor: { duration: 0.8, ease: 'easeInOut' },
          rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
        }}
        initial={false}
      />

      {/* ── Ring 3: Thin solid, fastest ── */}
      <motion.div
        className="jarvis-ring jarvis-ring-solid"
        style={{
          width: size + 48,
          height: size + 48,
          opacity: 0.25,
          zIndex: 1,
        }}
        animate={{
          borderColor: moodConfig.color,
          rotate: 360,
        }}
        transition={{
          borderColor: { duration: 0.8, ease: 'easeInOut' },
          rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
        }}
        initial={false}
      />

      {/* ── Stress Arc ── */}
      <StressArc size={size} stressLevel={stressLevel} color={moodConfig.color} />

      {/* ── Orbiting Particles ── */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="jarvis-particle"
          style={{
            width: p.size,
            height: p.size,
            top: '50%',
            left: '50%',
            marginTop: -p.size / 2,
            marginLeft: -p.size / 2,
            zIndex: 15,
            // CSS custom property for orbit radius
            ['--orbit-radius' as string]: `${p.radius}px`,
          }}
          animate={{
            backgroundColor: moodConfig.color,
            opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.4],
            // Use CSS animation for orbit, but animate color with framer
          }}
          transition={{
            backgroundColor: { duration: 0.8, ease: 'easeInOut' },
            opacity: { duration: p.duration, repeat: Infinity, ease: 'easeInOut' },
          }}
          initial={false}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'inherit',
              animation: `orbit-particle ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
              ['--orbit-radius' as string]: `${p.radius}px`,
            }}
          />
        </motion.div>
      ))}

      {/* ── Core Orb ── */}
      <motion.div
        className="jarvis-core"
        style={{
          width: size,
          height: size,
          zIndex: 10,
          boxShadow: `0 0 30px ${moodConfig.glowDim}, 0 0 80px ${moodConfig.glowDim}`,
        }}
        animate={{
          scale: [1, 1.06, 1],
          boxShadow: isRunning
            ? [
                `0 0 30px ${moodConfig.glowDim}, 0 0 80px ${moodConfig.glowDim}`,
                `0 0 50px ${moodConfig.glow}, 0 0 120px ${moodConfig.glowDim}`,
                `0 0 30px ${moodConfig.glowDim}, 0 0 80px ${moodConfig.glowDim}`,
              ]
            : `0 0 30px ${moodConfig.glowDim}, 0 0 80px ${moodConfig.glowDim}`,
        }}
        transition={{
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          boxShadow: isRunning
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.8, ease: 'easeInOut' },
        }}
        initial={false}
      >
        {/* Gradient background */}
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
          }}
          animate={{
            background: `radial-gradient(circle at 35% 35%, ${moodConfig.gradient[0]}, ${moodConfig.gradient[1]} 70%)`,
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          initial={false}
        />

        {/* Inner highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.25) 0%, transparent 50%)',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Scan line overlay */}
        <div
          className="jarvis-scan-overlay"
          style={
            {
              ['--scan-color' as string]: moodConfig.color,
            } as React.CSSProperties
          }
        />

        {/* Inner orb detail — smaller concentric circle */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: '50%',
            border: `1.5px solid ${moodConfig.color}`,
            opacity: 0.5,
          }}
          animate={{
            borderColor: moodConfig.color,
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            borderColor: { duration: 0.8 },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          initial={false}
        />

        {/* Center pulse dot */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.12,
            height: size * 0.12,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* ── Sound Wave Bars (visible when running) ── */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size + 70,
              height: size + 70,
              zIndex: 12,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {waveBars.map((bar, i) => {
              const angle = (i / waveBars.length) * 360;
              return (
                <motion.div
                  key={bar.id}
                  style={{
                    position: 'absolute',
                    bottom: '50%',
                    left: '50%',
                    width: 2,
                    marginLeft: -1,
                    transformOrigin: 'bottom center',
                    transform: `rotate(${angle}deg) translateY(-${orbRadius + 10}px)`,
                    borderRadius: 1,
                    backgroundColor: moodConfig.color,
                  }}
                  animate={{
                    height: [`${bar.heightPct * 0.3}%`, `${bar.heightPct}%`, `${bar.heightPct * 0.3}%`],
                    opacity: [0.4, 0.85, 0.4],
                  }}
                  transition={{
                    height: {
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: bar.delay,
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: bar.delay,
                    },
                  }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trading activity ring burst (running only) ── */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size,
              height: size,
              marginTop: -size / 2,
              marginLeft: -size / 2,
              borderRadius: '50%',
              border: `1px solid ${moodConfig.color}`,
              zIndex: 5,
              pointerEvents: 'none',
            }}
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Mood Label ── */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 25,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
        animate={{ color: moodConfig.color }}
        transition={{ duration: 0.5 }}
        initial={false}
      >
        <span
          style={{
            fontSize: Math.max(11, size * 0.1),
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {moodConfig.label}
        </span>
        {/* Status dot */}
        <motion.span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            marginLeft: 6,
            verticalAlign: 'middle',
            backgroundColor: isRunning ? moodConfig.color : '#64748b',
          }}
          animate={isRunning ? { opacity: [1, 0.3, 1], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
