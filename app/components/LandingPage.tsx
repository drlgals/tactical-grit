'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const LAUNCH_DATE = new Date('2026-08-31T00:00:00');

function getTimeLeft() {
  const diff = LAUNCH_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

const TAG_PATH =
  'M 22,3 L 138,3 Q 157,3 157,22 L 157,262 Q 157,279 138,279 L 93,279 A 13,13 0 0,0 67,279 L 22,279 Q 3,279 3,262 L 3,22 Q 3,3 22,3 Z';

function DogTag() {
  return (
    <div
      className="mt-16 flex flex-col items-center"
      style={{ filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.95)) drop-shadow(0 4px 10px rgba(0,0,0,0.7))' }}
    >
      <svg
        viewBox="0 0 160 290"
        style={{ width: 'clamp(150px, 18vw, 230px)', overflow: 'visible', transform: 'rotate(-4deg)' }}
        aria-label="Dog tag Tactical Grit"
      >
        <defs>
          {/* Brushed-metal horizontal gradient */}
          <linearGradient id="metalBase" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#b0b0b0" />
            <stop offset="10%"  stopColor="#d8d8d8" />
            <stop offset="22%"  stopColor="#efefef" />
            <stop offset="35%"  stopColor="#c4c4c4" />
            <stop offset="48%"  stopColor="#f5f5f5" />
            <stop offset="60%"  stopColor="#d0d0d0" />
            <stop offset="72%"  stopColor="#eaeaea" />
            <stop offset="85%"  stopColor="#c8c8c8" />
            <stop offset="100%" stopColor="#b8b8b8" />
          </linearGradient>

          {/* Brushed-metal texture (horizontal streaks) */}
          <filter id="brushed" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0 0.022" numOctaves="4" seed="7" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended" />
            <feComposite in="blended" in2="SourceGraphic" operator="in" />
          </filter>

          {/* Engraving: dark top edge + light bottom edge per glyph */}
          <filter id="engrave" x="-5%" y="-30%" width="110%" height="160%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.55" result="blur" />
            {/* dark shadow at top of each stroke */}
            <feOffset in="blur" dx="0" dy="-1" result="topBlur" />
            <feFlood floodColor="#000000" floodOpacity="0.75" result="black" />
            <feComposite in="black" in2="topBlur" operator="in" result="darkEdge" />
            {/* light highlight at bottom of each stroke */}
            <feOffset in="blur" dx="0" dy="1.2" result="bottomBlur" />
            <feFlood floodColor="#ffffff" floodOpacity="0.55" result="white" />
            <feComposite in="white" in2="bottomBlur" operator="in" result="lightEdge" />
            <feMerge>
              <feMergeNode in="darkEdge" />
              <feMergeNode in="lightEdge" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Chain-hole inner gradient */}
          <radialGradient id="holeGrad" cx="38%" cy="32%" r="62%">
            <stop offset="0%"   stopColor="#888" />
            <stop offset="35%"  stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#080808" />
          </radialGradient>

          {/* Chain-hole rim gradient */}
          <linearGradient id="rimGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%"   stopColor="#f0f0f0" />
            <stop offset="45%"  stopColor="#909090" />
            <stop offset="100%" stopColor="#e0e0e0" />
          </linearGradient>

          {/* Clip path for body */}
          <clipPath id="tagClip">
            <path d={TAG_PATH} />
          </clipPath>
        </defs>

        {/* ── Body ── */}
        {/* Base metal fill + brushed texture */}
        <path d={TAG_PATH} fill="url(#metalBase)" filter="url(#brushed)" />

        {/* Top-left bevel highlight */}
        <path
          d={TAG_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.8"
          clipPath="url(#tagClip)"
        />

        {/* Bottom-right shadow edge */}
        <path
          d={TAG_PATH}
          fill="none"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1"
        />

        {/* ── Chain hole ── */}
        {/* Rim */}
        <circle cx="80" cy="30" r="14" fill="url(#rimGrad)" />
        {/* Inner dark tunnel */}
        <circle cx="80" cy="30" r="10" fill="url(#holeGrad)" />
        {/* Rim top-highlight */}
        <circle cx="80" cy="30" r="14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        {/* Rim bottom-shadow */}
        <circle cx="80" cy="30" r="14" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />

        {/* ── Engraved text ── */}
        <g
          filter="url(#engrave)"
          fill="#626262"
          fontFamily="'Courier New', Courier, monospace"
          textAnchor="middle"
        >
          {/* Brand */}
          <text x="80" y="70" fontSize="10.5" fontWeight="700" letterSpacing="3.5" fill="#505050">
            TACTICAL GRIT
          </text>

          {/* Separator */}
          <text x="80" y="84" fontSize="5.5" letterSpacing="0.8" fill="#7a7a7a">
            ─────────────────
          </text>

          {/* Main phrase */}
          <text x="80" y="105" fontSize="9" letterSpacing="2.2">O CRONÔMETRO</text>
          <text x="80" y="121" fontSize="9" letterSpacing="2.2">ESTÁ RODANDO.</text>

          {/* Separator */}
          <text x="80" y="138" fontSize="5.5" letterSpacing="0.8" fill="#7a7a7a">
            ─────────────────
          </text>

          {/* Secondary phrase */}
          <text x="80" y="158" fontSize="7.8" letterSpacing="1.8">EM BREVE, A DATA</text>
          <text x="80" y="173" fontSize="7.8" letterSpacing="1.8">QUE VAI MUDAR</text>
          <text x="80" y="188" fontSize="7.8" letterSpacing="1.8">O SEU CALENDÁRIO.</text>
        </g>
      </svg>
    </div>
  );
}

function DigitBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {value.split('').map((d, i) => (
          <div
            key={i}
            className="relative w-16 h-24 sm:w-20 sm:h-32 md:w-28 md:h-40 bg-black border border-red-900 rounded flex items-center justify-center overflow-hidden"
            style={{ boxShadow: '0 0 12px rgba(220,38,38,0.4), inset 0 0 20px rgba(0,0,0,0.8)' }}
          >
            {/* inactive segments overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 select-none pointer-events-none text-red-900 font-mono text-5xl sm:text-6xl md:text-8xl font-bold">
              8
            </div>
            <span
              className="relative z-10 font-mono text-5xl sm:text-6xl md:text-8xl font-bold leading-none tabular-nums"
              style={{
                color: '#ff2200',
                textShadow: '0 0 8px #ff2200, 0 0 20px #ff4400, 0 0 40px rgba(255,34,0,0.5)',
              }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>
      <span
        className="text-xs sm:text-sm tracking-[0.3em] uppercase font-mono"
        style={{ color: '#ff2200', textShadow: '0 0 6px #ff2200' }}
      >
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div
      className="flex flex-col justify-center gap-3 pb-6 text-4xl sm:text-5xl md:text-6xl font-mono font-bold leading-none"
      style={{ color: '#ff2200', textShadow: '0 0 8px #ff2200' }}
    >
      <span>:</span>
      <span>:</span>
    </div>
  );
}

export default function LandingPage() {
  const [entered, setEntered] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  const videoRef = useRef<HTMLVideoElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playTick = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.type = 'square';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  }, []);

  const handleEnter = () => {
    audioCtxRef.current = new AudioContext();
    setEntered(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 100);
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
    tickIntervalRef.current = setInterval(playTick, 1000);
  };

  // Countdown ticker
  useEffect(() => {
    if (!videoEnded) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [videoEnded]);

  // Intersection observer for fade-in
  useEffect(() => {
    const el = countdownRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCountdownVisible(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [videoEnded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <div className="bg-black min-h-screen">
      {/* Entry screen */}
      {!entered && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-10">
          <p
            className="text-sm tracking-[0.5em] uppercase font-mono"
            style={{ color: '#ff2200', textShadow: '0 0 8px #ff2200' }}
          >
            Tactical Grit
          </p>
          <button
            onClick={handleEnter}
            className="border border-red-700 px-12 py-4 text-sm tracking-[0.4em] uppercase font-mono text-red-500 hover:bg-red-900/20 transition-colors duration-300"
            style={{ textShadow: '0 0 6px #ff2200', boxShadow: '0 0 12px rgba(220,38,38,0.3)' }}
          >
            Entrar
          </button>
        </div>
      )}

      {/* Video section */}
      <section className="w-full">
        <video
          ref={videoRef}
          src="/video/hero.mp4"
          playsInline
          className="w-full block"
          style={{ display: entered ? 'block' : 'none' }}
          onEnded={handleVideoEnd}
        />
      </section>

      {/* Spacer + countdown (only after video ends) */}
      {videoEnded && (
        <>
          <div className="h-[50vh]" />

          <section
            ref={countdownRef}
            className="flex flex-col items-center justify-center py-24 px-4 transition-all duration-1000"
            style={{
              opacity: countdownVisible ? 1 : 0,
              transform: countdownVisible ? 'translateY(0)' : 'translateY(40px)',
            }}
          >
            <div className="flex items-end gap-2 sm:gap-3 md:gap-4">
              <DigitBlock value={pad(timeLeft.days)} label="Dias" />
              <Separator />
              <DigitBlock value={pad(timeLeft.hours)} label="Horas" />
              <Separator />
              <DigitBlock value={pad(timeLeft.minutes)} label="Minutos" />
              <Separator />
              <DigitBlock value={pad(timeLeft.seconds)} label="Segundos" />
            </div>

            <DogTag />
          </section>

          <div className="h-[30vh]" />
        </>
      )}
    </div>
  );
}
