'use client';

import AngryBirdsGame from '@/components/AngryBirdsGame';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-500 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
          🐦 Vibe Angry Birds 🐷
        </h1>
        <p className="text-xl text-white/90 drop-shadow">
          웹에서 즐기는 앵그리버드 게임!
        </p>
      </div>
      
      <AngryBirdsGame />
    </main>
  );
}
