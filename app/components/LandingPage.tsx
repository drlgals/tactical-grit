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

function DogTag() {
  return (
    <div className="mt-16 flex flex-col items-center">
      <img
        src="/images/dogtag.png"
        alt="Dog tag Tactical Grit — O cronômetro está rodando. Em breve, a data que vai mudar o seu calendário."
        style={{
          width: 'clamp(220px, 28vw, 420px)',
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
      <section className="w-full relative">
        <video
          ref={videoRef}
          src="/video/hero.mp4"
          playsInline
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
