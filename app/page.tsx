'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Particle {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

const EMOJIS = ['📍', '🗺️', '✨', '☕', '🍽', '🌿', '💬', '🫶', '🎉'];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    emoji: EMOJIS[index % EMOJIS.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 3,
    size: 16 + Math.random() * 20,
  }));
}

export default function SplashPage() {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setParticles(generateParticles(12));

    timerRef.current = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    }, 2400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: 'linear-gradient(135deg, #D0704C 0%, #E27D60 35%, #6FA48B 70%, #5B8DEF 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradientShift 4s ease infinite',
      }}
      aria-label="가자고 스플래시 화면"
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="pointer-events-none absolute select-none"
          style={{
            left: `${particle.left}%`,
            bottom: '-20px',
            fontSize: `${particle.size}px`,
            animationName: 'floatUp',
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            animationTimingFunction: 'ease-out',
            animationIterationCount: 'infinite',
            animationFillMode: 'forwards',
          }}
          aria-hidden
        >
          {particle.emoji}
        </span>
      ))}

      <div className="z-10 flex flex-col items-center gap-4 animate-pop-in">
        <span className="text-[72px] leading-none animate-float-bob" aria-hidden>
          📍
        </span>
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">가자고</h1>
          <p className="mt-2 text-sm font-medium text-white/85">같이 고르고, 저장하고, 바로 가자.</p>
        </div>

        <div className="mt-4 flex gap-2" aria-label="로딩 중">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 rounded-full bg-white/70 animate-bounce-dot"
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
