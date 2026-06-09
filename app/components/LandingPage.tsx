'use client';

import Image from 'next/image';
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

function DogTag() {
  return (
    <div className="mt-10 sm:mt-16 flex flex-col items-center">
      <Image
        src="/images/dogtag.webp"
        alt="Dog tag Tactical Grit — O cronômetro está rodando. Em breve, a data que vai mudar o seu calendário."
        width={840}
        height={1188}
        sizes="(max-width: 640px) 55vw, 420px"
        priority={false}
        style={{
          width: 'clamp(180px, 55vw, 420px)',
          height: 'auto',
          transform: 'rotate(-4deg)',
          filter: 'drop-shadow(0 20px 50px rgba(0,0,0,1)) drop-shadow(0 6px 16px rgba(0,0,0,0.8))',
          userSelect: 'none',
          pointerEvents: 'none',
          maskImage: 'radial-gradient(ellipse 78% 82% at 42% 48%, black 45%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 78% 82% at 42% 48%, black 45%, transparent 100%)',
        }}
        draggable={false}
      />
    </div>
  );
}

function DigitBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2">
      <div className="flex gap-px sm:gap-1">
        {value.split('').map((d, i) => (
          <div
            key={i}
            className="relative w-7 h-11 sm:w-16 sm:h-24 md:w-28 md:h-40 bg-black border border-red-900 rounded flex items-center justify-center overflow-hidden"
            style={{ boxShadow: '0 0 8px rgba(220,38,38,0.4), inset 0 0 12px rgba(0,0,0,0.8)' }}
          >
            {/* inactive segments overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 select-none pointer-events-none text-red-900 font-mono text-xl sm:text-5xl md:text-8xl font-bold">
              8
            </div>
            <span
              className="relative z-10 font-mono text-xl sm:text-5xl md:text-8xl font-bold leading-none tabular-nums"
              style={{
                color: '#ff2200',
                textShadow: '0 0 6px #ff2200, 0 0 14px #ff4400, 0 0 28px rgba(255,34,0,0.5)',
              }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>
      <span
        className="text-[7px] sm:text-xs tracking-[0.15em] sm:tracking-[0.3em] uppercase font-mono"
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
      className="flex flex-col justify-center gap-1 sm:gap-3 pb-3 sm:pb-6 text-xl sm:text-4xl md:text-6xl font-mono font-bold leading-none"
      style={{ color: '#ff2200', textShadow: '0 0 8px #ff2200' }}
    >
      <span>:</span>
      <span>:</span>
    </div>
  );
}

export default function LandingPage() {
  const [entered, setEntered] = useState(false);
  const [crtOn, setCrtOn] = useState(false);
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

  const handleEnter = async () => {
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    audioCtxRef.current = ctx;

    // 1. Dispara animação CRT
    setCrtOn(true);

    // 2. No pico da expansão (~700ms): troca para vídeo por baixo do overlay
    setTimeout(() => {
      setEntered(true);
      videoRef.current?.play().catch(() => {});
    }, 700);

    // 3. Overlay some (~1100ms): usuário já vê o vídeo
    setTimeout(() => setCrtOn(false), 1100);
  };

  // Fade-out de áudio nos últimos 2s do vídeo
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const remaining = video.duration - video.currentTime;
    const FADE_DURATION = 2; // segundos
    if (remaining <= FADE_DURATION) {
      video.volume = Math.max(0, remaining / FADE_DURATION);
    }
  };

  const handleVideoEnd = () => {
    if (videoRef.current) videoRef.current.volume = 0;
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
      {/* ── Tela de entrada: estética fósforo / CRT ── */}
      {!entered && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden select-none"
          style={{ background: '#000a02', animation: 'phosphor-flicker 9s infinite' }}
        >
          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.22) 3px, rgba(0,0,0,0.22) 4px)',
              zIndex: 1,
            }}
          />
          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.92) 100%)',
              zIndex: 2,
            }}
          />

          {/* Conteúdo */}
          <div
            className="relative flex flex-col items-center gap-6 px-8"
            style={{ zIndex: 10, fontFamily: 'var(--font-geist-mono), monospace' }}
          >
            {/* Linha decorativa */}
            <p style={{ color: '#00843a', textShadow: '0 0 6px #00ff41', fontSize: '10px', letterSpacing: '0.35em', opacity: 0.65 }}>
              ══════════════════════════
            </p>

            <p style={{ color: '#00843a', textShadow: '0 0 8px #00ff41', fontSize: '9px', letterSpacing: '0.45em', opacity: 0.7 }}>
              SISTEMA TÁTICO OPERACIONAL
            </p>

            {/* Título principal */}
            <p
              style={{
                color: '#00ff41',
                textShadow: '0 0 6px #00ff41, 0 0 18px #00cc33, 0 0 38px #007a1f',
                fontSize: 'clamp(16px, 5vw, 22px)',
                letterSpacing: '0.65em',
                fontWeight: 700,
              }}
            >
              TACTICAL&nbsp;GRIT
            </p>

            <p style={{ color: '#00843a', textShadow: '0 0 6px #00ff41', fontSize: '10px', letterSpacing: '0.35em', opacity: 0.65 }}>
              ══════════════════════════
            </p>

            <p style={{ color: '#00843a', fontSize: '8px', letterSpacing: '0.3em', opacity: 0.5, marginTop: '4px' }}>
              // AUTORIZAÇÃO NECESSÁRIA //
            </p>

            {/* Botão terminal */}
            <button
              onClick={handleEnter}
              style={{
                marginTop: '24px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'clamp(12px, 3.5vw, 15px)',
                letterSpacing: '0.45em',
                color: '#00ff41',
                textShadow: '0 0 8px #00ff41, 0 0 20px #00cc33',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '22px 44px',
                touchAction: 'manipulation',
              }}
            >
              <span style={{ opacity: 0.8 }}>&gt;</span>
              <span>ENTRAR</span>
              {/* Cursor piscante */}
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '1.1em',
                  background: '#00ff41',
                  boxShadow: '0 0 8px #00ff41',
                  animation: 'cursor-blink 1s step-end infinite',
                  verticalAlign: 'middle',
                }}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── Overlay CRT ligando ── */}
      {crtOn && (
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 60 }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, #003d12 0%, #00cc33 35%, #c8ffc8 50%, #00cc33 65%, #003d12 100%)',
              transformOrigin: '50% 50%',
              animation: 'crt-power-on 1.1s cubic-bezier(0.19, 1, 0.22, 1) forwards',
            }}
          />
        </div>
      )}

      {/* Video section */}
      <section className="w-full relative">
        <video
          ref={videoRef}
          src="/video/hero.mp4"
          playsInline
          preload="metadata"
          className="w-full block"
          style={{ display: entered ? 'block' : 'none' }}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
        />
        {/* Gradiente de transição vídeo → preto */}
        {entered && (
          <div
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{
              height: '35%',
              background: 'linear-gradient(to bottom, transparent, #000)',
            }}
          />
        )}
      </section>

      {/* Spacer + countdown (only after video ends) */}
      {videoEnded && (
        <>
          <div className="h-[8vh] sm:h-[12vh]" />

          <section
            ref={countdownRef}
            className="flex flex-col items-center justify-center py-24 px-4 transition-all duration-1000"
            style={{
              opacity: countdownVisible ? 1 : 0,
              transform: countdownVisible ? 'translateY(0)' : 'translateY(40px)',
            }}
          >
            <div className="flex items-end gap-1 sm:gap-2 md:gap-4">
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
