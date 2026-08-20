import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import type { TabType } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';

// Page Views
import { HomePage } from '../../pages/HomePage';
import { SearchPage } from '../../pages/SearchPage';
import { LibraryPage } from '../../pages/LibraryPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { PlaylistDetailPage } from '../../pages/PlaylistDetailPage';

// Components
import { MiniPlayer } from '../player/MiniPlayer';
import { FullScreenPlayer } from '../player/FullScreenPlayer';
import { Toast } from '../common/Toast';
import { OnboardingModal } from '../common/OnboardingModal';

// Icons
import { Home, Search, Library as LibraryIcon, Settings, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Heart, Volume2, AlignLeft, Music, ListMusic, X } from 'lucide-react';

export const AppShell: React.FC = () => {
  // Instantiates the HTML5 Audio engine lifecycle at the root level of the app
  const { seekAudio } = useAudioEngine();

  const { activeTab, setActiveTab, selectedPlaylistId, showToast } = useUIStore();
  const {
    queue,
    currentIndex,
    isPlaying,
    progressSec,
    durationSec,
    volume,
    isShuffled,
    repeatMode,
    togglePlay,
    next,
    previous,
    toggleShuffle,
    cycleRepeatMode,
    setVolume,
    setQueue,
    setCurrentIndex,
    removeFromQueue,
  } = usePlayerStore();

  const { toggleLike, isLiked } = useLibraryStore();
  const [showDesktopLyrics, setShowDesktopLyrics] = useState(false);
  const [showDesktopQueue, setShowDesktopQueue] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem('beatmess-onboarded') && useLibraryStore.getState().history.length === 0
  );

  // Back button and history management for mobile navigation
  useEffect(() => {
    // Replace initial state with home tab
    if (!window.history.state) {
      window.history.replaceState({ tab: 'home', fullScreen: false }, '', '#home');
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        usePlayerStore.getState().setFullScreenOpen(!!e.state.fullScreen);
        if (e.state.tab) {
          useUIStore.getState().setActiveTab(e.state.tab);
        }
      } else {
        usePlayerStore.getState().setFullScreenOpen(false);
        useUIStore.getState().setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync tab change to history
  useEffect(() => {
    if (window.history.state && window.history.state.tab !== activeTab) {
      window.history.pushState({ tab: activeTab, fullScreen: false }, '', `#${activeTab}`);
    }
  }, [activeTab]);

  // Sync fullscreen player open/close to history
  const isFullScreenOpen = usePlayerStore(state => state.isFullScreenOpen);
  useEffect(() => {
    if (isFullScreenOpen) {
      if (!window.history.state?.fullScreen) {
        window.history.pushState({ tab: activeTab, fullScreen: true }, '', '#player');
      }
    } else {
      if (window.history.state?.fullScreen) {
        window.history.back();
      }
    }
  }, [isFullScreenOpen, activeTab]);

  const activeSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Sync volume logic
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  // Sync seek logic
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekAudio(parseFloat(e.target.value));
  };

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

  const renderActiveView = () => {
    if (selectedPlaylistId) {
      return <PlaylistDetailPage />;
    }

    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'search':
        return <SearchPage />;
      case 'library':
        return <LibraryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  const liked = activeSong ? isLiked(activeSong.id) : false;

  // Split lyrics text by HTML line breaks or newlines
  const parsedLyrics = activeSong?.lyrics
    ? activeSong.lyrics.replace(/<br\s*\/?>/gi, '\n').split('\n')
    : [];

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0a0a0f] text-on-surface overflow-hidden relative">
      {/* Toast System */}
      <Toast />
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* ========================================================================= */}
      {/* DESKTOP VIEW: Split Screen (55% player on left, 45% browsing on right) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-1 h-full overflow-hidden">
        
        {/* Left Column (55%): Premium Immersive Player */}
        <section className="w-[55%] h-full flex flex-col justify-between items-center p-12 border-r border-white/5 relative overflow-hidden bg-[#0c0c12]">
          
          {/* Blurred Artwork Ambient Background Overlay */}
          {activeSong && (
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-[100px] opacity-15 pointer-events-none transition-all duration-500 scale-110"
              style={{ backgroundImage: `url(${activeSong.image})` }}
            ></div>
          )}
          
          {/* Logo brand */}
          <div className="w-full text-left relative z-10 select-none">
            <h1 className="font-display-lg text-2xl font-bold bg-gradient-to-r from-accent-violet to-accent-pink bg-clip-text text-transparent">BeatMess</h1>
          </div>

          {/* Active Song display (Art OR Lyrics OR Queue) */}
          <div className="w-full flex-1 flex flex-col items-center justify-center relative z-10 py-6 min-h-0">
            {activeSong ? (
              showDesktopQueue ? (
                /* Draggable Queue List */
                <div className="w-full max-w-md h-full flex flex-col min-h-0 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm text-primary font-display-lg">Up Next</h3>
                    <button onClick={() => setShowDesktopQueue(false)} className="text-xs text-on-surface-variant hover:text-on-surface">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto hide-scrollbar glass-panel border-white/5 bg-surface/30 rounded-2xl p-4 min-h-0 space-y-2 shadow-inner">
                    {queue.map((song, idx) => {
                      const isActive = idx === currentIndex;
                      return (
                        <div
                          key={song.id + '-' + idx}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onClick={() => setCurrentIndex(idx)}
                          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                            isActive ? 'bg-primary/20 border border-primary/20 shadow-inner' : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="text-on-surface-variant/40 hover:text-on-surface-variant cursor-grab active:cursor-grabbing p-1">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                          </div>
                          <img src={song.image} alt={song.title} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-sm truncate font-semibold ${isActive ? 'text-primary' : 'text-on-surface'}`}>{song.title}</h4>
                            <p className="text-xs text-on-surface-variant truncate">{song.artist}</p>
                          </div>
                          {isActive ? (
                            <span className="text-[10px] font-bold text-primary font-label-caps uppercase bg-primary/10 px-2 py-0.5 rounded-md flex-shrink-0">Playing</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromQueue(song.id, idx);
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
              ) : !showDesktopLyrics ? (
                /* Cover Art display */
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-64 h-64 lg:w-72 lg:h-72 rounded-[24px] overflow-hidden glass-panel border-white/12 shadow-2xl p-2 flex items-center justify-center max-w-[300px]">
                    <img src={activeSong.image} alt={activeSong.title} className="w-full h-full object-cover rounded-[18px]" />
                  </div>
                  <div className="mt-8 text-center px-4 max-w-md">
                    <h2 className="font-display-lg font-bold text-xl truncate text-on-surface">{activeSong.title}</h2>
                    <p className="text-sm text-on-surface-variant truncate mt-1">{activeSong.artist}</p>
                  </div>
                </div>
              ) : (
                /* Lyrics Display */
                <div className="w-full max-w-md h-full flex flex-col min-h-0 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm text-primary font-display-lg">Lyrics</h3>
                    <button onClick={() => setShowDesktopLyrics(false)} className="text-[11px] text-on-surface-variant hover:text-on-surface">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto hide-scrollbar glass-panel border-white/5 bg-surface/30 rounded-2xl p-6 min-h-0 space-y-4 shadow-inner">
                    {parsedLyrics.length > 0 ? (
                      parsedLyrics.map((line, idx) => (
                        <p key={idx} className="text-[15px] leading-relaxed text-on-surface hover:text-white transition-colors">
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
              )
            ) : (
              /* Idle Empty State */
              <div className="flex flex-col items-center justify-center text-center p-6 select-none opacity-60">
                <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                  <Music className="text-on-surface-variant" size={28} />
                </div>
                <p className="text-sm text-on-surface-variant">Select a track to start listening</p>
              </div>
            )}
          </div>

          {/* Player controls dashboard */}
          {activeSong && (
            <div className="w-full max-w-md flex flex-col items-center gap-6 relative z-10 select-none">
              
              {/* Seeker slider */}
              <div className="w-full">
                <input
                  type="range"
                  min="0"
                  max={durationSec || 100}
                  value={progressSec}
                  onChange={handleSeekChange}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${
                      (progressSec / (durationSec || 1)) * 100
                    }%, rgba(255,255,255,0.1) ${(progressSec / (durationSec || 1)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-2 font-label-caps">
                  <span>{formatTime(progressSec)}</span>
                  <span>{formatTime(durationSec)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full flex justify-between items-center px-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 active:scale-95 duration-200 transition-transform ${
                    isShuffled ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Shuffle size={18} />
                </button>
                
                <button
                  onClick={previous}
                  className="text-on-surface hover:text-primary p-2 active:scale-95 duration-200 transition-transform"
                >
                  <SkipBack size={22} fill="currentColor" />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-white text-background flex items-center justify-center hover:scale-105 active:scale-95 duration-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                >
                  {isPlaying ? (
                    <Pause size={24} fill="currentColor" />
                  ) : (
                    <Play size={24} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                
                <button
                  onClick={() => next()}
                  className="text-on-surface hover:text-primary p-2 active:scale-95 duration-200 transition-transform"
                >
                  <SkipForward size={22} fill="currentColor" />
                </button>
                
                <button
                  onClick={cycleRepeatMode}
                  className={`p-2 active:scale-95 duration-200 transition-transform relative ${
                    repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Repeat size={18} />
                  {repeatMode === 'one' && (
                    <span className="absolute top-0 right-0 text-[7px] bg-primary text-background font-bold rounded-full w-2.5 h-2.5 flex items-center justify-center">1</span>
                  )}
                </button>
              </div>

              {/* Seeker / Lyrics Utilities */}
              <div className="w-full flex justify-between items-center gap-6 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Volume2 size={14} className="text-on-surface-variant" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-on-surface"
                    style={{
                      background: `linear-gradient(to right, rgba(245,245,247,0.6) 0%, rgba(245,245,247,0.6) ${
                        volume * 100
                      }%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toggleLike(activeSong);
                      showToast(isLiked(activeSong.id) ? 'Removed from Liked Songs' : 'Added to Liked Songs', 'info');
                    }}
                    className={`p-2 rounded-full hover:bg-white/5 active:scale-95 duration-200 transition-transform ${
                      liked ? 'text-accent-pink' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDesktopQueue(!showDesktopQueue);
                      setShowDesktopLyrics(false);
                    }}
                    className={`glass-panel px-3 py-1.5 rounded-full font-label-caps text-[10px] font-bold tracking-wider flex items-center gap-1 border-white/10 ${
                      showDesktopQueue ? 'bg-primary text-background border-primary' : 'text-on-surface hover:bg-white/10'
                    }`}
                  >
                    <ListMusic size={12} />
                    <span>QUEUE</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDesktopLyrics(!showDesktopLyrics);
                      setShowDesktopQueue(false);
                    }}
                    className={`glass-panel px-3 py-1.5 rounded-full font-label-caps text-[10px] font-bold tracking-wider flex items-center gap-1 border-white/10 ${
                      showDesktopLyrics ? 'bg-primary text-background border-primary' : 'text-on-surface hover:bg-white/10'
                    }`}
                  >
                    <AlignLeft size={12} />
                    <span>LYRICS</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </section>

        {/* Right Column (45%): Pages Shell */}
        <section className="w-[45%] h-full flex flex-col bg-[#08080c] relative">
          {/* Top Tabs Nav */}
          <nav className="flex justify-between items-center py-5 px-8 border-b border-white/5 bg-surface/5 backdrop-blur-[20px] select-none z-10">
            <div className="flex gap-4">
              {(['home', 'search', 'library', 'settings'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`font-label-caps text-[11px] font-bold tracking-widest uppercase transition-colors px-3 py-1.5 rounded-full ${
                    activeTab === tab
                      ? 'text-primary bg-white/5 border border-white/5'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </nav>

          {/* Render Active View Canvas */}
          <div className="flex-1 overflow-y-auto px-8 pt-6 min-h-0">
            {renderActiveView()}
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW: Tab bar (Bottom navigation tab panel + sliding player drawer) */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col flex-1 h-full overflow-hidden">
        
        {/* Mobile Header bar */}
        <header className="flex justify-between items-center py-4 px-6 border-b border-white/5 bg-surface/10 backdrop-blur-xl select-none z-20">
          <h1 className="font-display-lg text-lg font-bold bg-gradient-to-r from-accent-violet to-accent-pink bg-clip-text text-transparent">BeatMess</h1>
        </header>

        {/* Main Canvas view */}
        <main className="flex-1 overflow-y-auto px-margin-mobile pt-4 min-h-0 relative">
          {renderActiveView()}
        </main>

        {/* Floating Mini Player */}
        <MiniPlayer />

        {/* Full Screen Player overlay drawer */}
        <FullScreenPlayer seekAudio={seekAudio} />

        {/* Mobile Tab Bar */}
        <nav className="z-30 h-16 bg-[#0a0a0f]/90 border-t border-white/5 flex items-center justify-around select-none backdrop-blur-xl">
          {(['home', 'search', 'library', 'settings'] as TabType[]).map((tab) => {
            const getIcon = () => {
              switch (tab) {
                case 'home': return <Home size={20} />;
                case 'search': return <Search size={20} />;
                case 'library': return <LibraryIcon size={20} />;
                case 'settings': return <Settings size={20} />;
              }
            };
            const active = activeTab === tab && !selectedPlaylistId;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-col items-center justify-center gap-1 active:scale-95 duration-200 transition-all ${
                  active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {getIcon()}
                <span className="text-[9px] font-bold tracking-wider font-label-caps uppercase">{tab}</span>
              </button>
            );
          })}
        </nav>

      </div>
      {/* Hidden YouTube IFrame Player Placeholder */}
      <div id="yt-player-placeholder" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1px', height: '1px', pointerEvents: 'none' }} />
    </div>
  );
};
export default AppShell;
