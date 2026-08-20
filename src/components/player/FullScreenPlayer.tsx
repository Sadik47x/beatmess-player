import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { useUIStore } from '../../stores/uiStore';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Heart, ChevronDown, Volume2, AlignLeft, ListMusic, X } from 'lucide-react';

interface FullScreenPlayerProps {
  seekAudio: (sec: number) => void;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({ seekAudio }) => {
  const {
    queue,
    currentIndex,
    isPlaying,
    progressSec,
    durationSec,
    volume,
    isShuffled,
    repeatMode,
    isFullScreenOpen,
    togglePlay,
    next,
    previous,
    toggleShuffle,
    cycleRepeatMode,
    setVolume,
    setFullScreenOpen,
    setQueue,
    setCurrentIndex,
    removeFromQueue,
  } = usePlayerStore();

  const { toggleLike, isLiked } = useLibraryStore();
  const { showToast } = useUIStore();

  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [localProgress, setLocalProgress] = useState(progressSec);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync local progress with playerStore progress when NOT dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progressSec);
    }
  }, [progressSec, isDragging]);

  if (!activeSong() || !isFullScreenOpen) return null;

  const song = activeSong();
  if (!song) return null;

  const liked = isLiked(song.id);

  function activeSong() {
    if (currentIndex >= 0 && currentIndex < queue.length) {
      return queue[currentIndex];
    }
    return null;
  }

  // Time format helper (e.g. 135 -> 2:15)
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProgress(parseFloat(e.target.value));
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
    seekAudio(localProgress);
  };

  const handleLikeToggle = () => {
    toggleLike(song);
    showToast(isLiked(song.id) ? 'Removed from Liked Songs' : 'Added to Liked Songs', 'info');
  };

  // Drag and Drop reordering logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedQueue = [...queue];
    const [draggedItem] = updatedQueue.splice(draggedIndex, 1);
    updatedQueue.splice(index, 0, draggedItem);

    let newCurrentIndex = currentIndex;
    if (currentIndex === draggedIndex) {
      newCurrentIndex = index;
    } else if (currentIndex > draggedIndex && currentIndex <= index) {
      newCurrentIndex -= 1;
    } else if (currentIndex < draggedIndex && currentIndex >= index) {
      newCurrentIndex += 1;
    }

    setQueue(updatedQueue);
    setCurrentIndex(newCurrentIndex);
    setDraggedIndex(null);
    showToast('Queue reordered', 'info');
  };

  // Split lyrics text by HTML line breaks or newlines
  const parsedLyrics = song.lyrics
    ? song.lyrics.replace(/<br\s*\/?>/gi, '\n').split('\n')
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col md:hidden animate-slide-up overflow-hidden">
      {/* Blurred Album Art Ambient Background */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 pointer-events-none transition-all duration-500 scale-110"
        style={{ backgroundImage: `url(${song.image})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50 pointer-events-none"></div>

      {/* Header bar */}
      <div className="relative z-10 flex justify-between items-center px-6 py-4">
        <button
          onClick={() => setFullScreenOpen(false)}
          className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-white/5 active:scale-95 duration-200 transition-transform"
        >
          <ChevronDown size={24} />
        </button>
        <span className="font-label-caps text-[11px] tracking-wider text-on-surface-variant font-bold">NOW PLAYING</span>
        <button
          onClick={() => {
            setShowQueue(!showQueue);
            setShowLyrics(false);
          }}
          className={`p-2 rounded-full hover:bg-white/5 active:scale-95 duration-200 transition-colors ${
            showQueue ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <ListMusic size={20} />
        </button>
      </div>

      {/* Body content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8 select-none">
        
        {/* Main Display: Cover Art OR Lyrics OR Queue */}
        {showQueue ? (
          /* Up Next Queue List */
          <div className="w-full flex-1 flex flex-col mb-6 pt-4 min-h-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg text-primary">Up Next</h2>
              <button onClick={() => setShowQueue(false)} className="text-xs text-on-surface-variant hover:text-on-surface">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar glass-panel border-white/5 bg-surface/30 rounded-2xl p-4 min-h-0 space-y-2">
              {queue.map((qSong, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={qSong.id + '-' + idx}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                      isActive ? 'bg-primary/20 border border-primary/20 shadow-inner' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* Grab Handle Icon */}
                    <div className="text-on-surface-variant/40 hover:text-on-surface-variant cursor-grab active:cursor-grabbing p-1">
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                    </div>
                    <img src={qSong.image} alt={qSong.title} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-sm truncate font-semibold ${isActive ? 'text-primary' : 'text-on-surface'}`}>{qSong.title}</h4>
                      <p className="text-xs text-on-surface-variant truncate">{qSong.artist}</p>
                    </div>
                    {isActive ? (
                      <span className="text-[10px] font-bold text-primary font-label-caps uppercase bg-primary/10 px-2 py-0.5 rounded-md flex-shrink-0">Playing</span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(qSong.id, idx);
                        }}
                        className="text-on-surface-variant/40 hover:text-red-400 p-1.5 rounded-full hover:bg-white/5 transition-colors flex-shrink-0"
                        title="Remove from queue"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : !showLyrics ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            {/* Cover Art Card */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-[24px] overflow-hidden glass-panel border-white/12 shadow-2xl p-2 mb-10 flex items-center justify-center max-w-[280px] max-h-[280px]">
              <img src={song.image} alt={song.title} className="w-full h-full object-cover rounded-[18px]" />
            </div>
            
            {/* Song Metadata */}
            <div className="w-full flex justify-between items-center mb-6">
              <div className="min-w-0 flex-1 pr-4">
                <h1 className="font-display-lg font-bold text-2xl truncate text-on-surface">{song.title}</h1>
                <p className="text-base text-on-surface-variant truncate mt-1">{song.artist}</p>
              </div>
              <button
                onClick={handleLikeToggle}
                className={`hover:scale-110 active:scale-95 duration-200 transition-transform ${
                  liked ? 'text-accent-pink' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Heart size={26} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        ) : (
          /* Lyrics Panel Overlay */
          <div className="w-full flex-1 flex flex-col mb-6 pt-4 min-h-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg text-primary">Lyrics</h2>
              <button onClick={() => setShowLyrics(false)} className="text-xs text-on-surface-variant hover:text-on-surface">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar glass-panel border-white/5 bg-surface/30 rounded-2xl p-6 min-h-0 space-y-4">
              {parsedLyrics.length > 0 ? (
                parsedLyrics.map((line, idx) => (
                  <p key={idx} className="text-base leading-relaxed text-on-surface hover:text-white transition-colors">
                    {line.trim()}
                  </p>
                ))
              ) : (
                <p className="text-on-surface-variant text-center py-12 text-sm italic">
                  Lyrics not found for this track.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timeline (SeekBar) */}
        <div className="w-full mb-6">
          <input
            type="range"
            min="0"
            max={durationSec || 100}
            value={localProgress}
            onChange={handleSeekChange}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary slider-thumb"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${
                (localProgress / (durationSec || 1)) * 100
              }%, rgba(255,255,255,0.1) ${(localProgress / (durationSec || 1)) * 100}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-2 font-label-caps">
            <span>{formatTime(localProgress)}</span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>

        {/* Media Controls */}
        <div className="w-full flex justify-between items-center mb-8">
          <button
            onClick={toggleShuffle}
            className={`p-2 active:scale-95 duration-200 transition-transform ${
              isShuffled ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Shuffle size={20} />
          </button>
          
          <button
            onClick={previous}
            className="text-on-surface hover:text-primary p-2 active:scale-95 duration-200 transition-transform"
          >
            <SkipBack size={28} fill="currentColor" />
          </button>
          
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white text-background flex items-center justify-center hover:scale-105 active:scale-95 duration-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>
          
          <button
            onClick={() => next()}
            className="text-on-surface hover:text-primary p-2 active:scale-95 duration-200 transition-transform"
          >
            <SkipForward size={28} fill="currentColor" />
          </button>
          
          <button
            onClick={cycleRepeatMode}
            className={`p-2 active:scale-95 duration-200 transition-transform relative ${
              repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Repeat size={20} />
            {repeatMode === 'one' && (
              <span className="absolute top-0 right-0 text-[8px] bg-primary text-background font-bold rounded-full w-3 h-3 flex items-center justify-center">1</span>
            )}
          </button>
        </div>

        {/* Footer Utilities: Volume and Lyrics Toggle */}
        <div className="w-full flex justify-between items-center gap-6 mt-auto">
          {/* Volume slider */}
          <div className="flex items-center gap-2 flex-1">
            <Volume2 size={16} className="text-on-surface-variant" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-on-surface"
              style={{
                background: `linear-gradient(to right, rgba(245,245,247,0.6) 0%, rgba(245,245,247,0.6) ${
                  volume * 100
                }%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
          </div>

          {/* Lyrics toggle button */}
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className={`glass-panel px-4 py-2 rounded-full font-label-caps text-[11px] font-bold tracking-wider flex items-center gap-1.5 duration-200 transition-colors border-white/10 ${
              showLyrics ? 'bg-primary text-background border-primary' : 'text-on-surface hover:bg-white/10'
            }`}
          >
            <AlignLeft size={14} />
            <span>LYRICS</span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default FullScreenPlayer;
