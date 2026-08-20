import React from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const { queue, currentIndex, isPlaying, progressSec, durationSec, togglePlay, next, setFullScreenOpen } = usePlayerStore();

  const activeSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  if (!activeSong) return null;

  const progressPercent = durationSec > 0 ? (progressSec / durationSec) * 100 : 0;

  return (
    <div
      onClick={() => setFullScreenOpen(true)}
      className="fixed bottom-[72px] left-[12px] right-[12px] z-40 glass-panel bg-surface/80 border-white/12 rounded-2xl p-3 flex items-center justify-between shadow-2xl backdrop-blur-xl md:hidden cursor-pointer hover:bg-white/10 transition-colors"
    >
      {/* Top Edge Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/10 rounded-t-2xl overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-violet to-accent-pink shadow-[0_0_8px_rgba(139,92,246,0.6)]"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Track Art & Metadata */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container shadow-md">
          <img src={activeSong.image} alt={activeSong.title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate text-on-surface">{activeSong.title}</p>
          <p className="text-xs text-on-surface-variant truncate">{activeSong.artist}</p>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-white text-background flex items-center justify-center hover:scale-105 active:scale-95 duration-200 transition-transform shadow-lg"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
        <button
          onClick={() => next()}
          className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-white/5 active:scale-95 duration-200"
        >
          <SkipForward size={18} />
        </button>
        <button
          onClick={() => setFullScreenOpen(true)}
          className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-white/5 md:hidden"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};
