"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type ConfettiParticle = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rotation: number;
};

const PRIMARY_COLORS = ["#A51C30", "#8B1538", "#742A2A", "#ea580c", "#f59e0b"];

export default function WelcomeStatusPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    setIsVisible(true);

    // Generate confetti particles with theme colors
    const newConfetti = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 4,
      color: PRIMARY_COLORS[Math.floor(Math.random() * PRIMARY_COLORS.length)],
      duration: Math.random() * 2 + 1.5,
      delay: Math.random() * 2,
      rotation: Math.random() * 360,
    }));
    setConfetti(newConfetti);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/30">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg width="60" height="60" viewBox="0 0 60 60" className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="#A51C30" opacity="0.25" />
              <circle cx="0" cy="0" r="1" fill="#8B1538" opacity="0.2" />
              <circle cx="60" cy="60" r="1" fill="#742A2A" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Confetti particles with fall animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-sm"
            style={{
              left: `${particle.x}%`,
              top: `-${particle.size}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: 0.85,
              transform: `rotate(${particle.rotation}deg)`,
              animation: `confetti-fall ${particle.duration}s linear ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 p-8 max-w-5xl mx-auto min-h-screen flex flex-col justify-center items-center">
        <div
          className={`transform transition-all duration-700 ease-out ${
            isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95"
          }`}
        >
          {/* Cracker icons with pop animation */}
          <div className="flex justify-center gap-4 mb-6">
            <span
              className="text-5xl sm:text-6xl animate-bounce"
              style={{ animationDelay: "0s", animationDuration: "1.2s" }}
            >
              🎊
            </span>
            <span
              className="text-5xl sm:text-6xl animate-bounce"
              style={{ animationDelay: "0.2s", animationDuration: "1.2s" }}
            >
              🎉
            </span>
            <span
              className="text-5xl sm:text-6xl animate-bounce"
              style={{ animationDelay: "0.4s", animationDuration: "1.2s" }}
            >
              🎊
            </span>
          </div>

          {/* Main welcome card */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 mb-8 shadow-xl border border-primary-100 max-w-xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-primary-800 mb-6">
                Welcome to Our Family!
              </h1>

              <div className="bg-primary-50 border-l-4 border-primary-600 rounded-lg px-6 py-5 mb-2">
                <div className="flex items-start gap-4">
                  <span className="text-3xl animate-pulse">💚</span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-primary-800 mb-1">
                      You&apos;re Now Part of Something Special
                    </h3>
                    <p className="text-primary-700/90 text-sm leading-relaxed">
                      Thank you for joining our student-led mission to create positive change.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => router.push("/")}
              className="group px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span className="group-hover:scale-110 transition-transform">🏠</span>
              Go to Home
            </button>
          </div>

          {/* Footer - no university name */}
          <div className="text-center">
            <p className="text-neutral-500 text-sm">
              MoreThanMe — Hearts for India
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0.4;
          }
        }
      `}</style>
    </main>
  );
}
