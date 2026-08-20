import { create } from 'zustand';
import type { Song } from '../types/song';

interface PlayerState {
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  progressSec: number;
  durationSec: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isFullScreenOpen: boolean;
  
  // Recommendation state
  isGeneratingRecommendations: boolean;
  homePageSongIds: string[];

  // Computed / Helpers
  activeSong: () => Song | null;
  
  // Actions
  setQueue: (queue: Song[]) => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setProgressSec: (progress: number) => void;
  setDurationSec: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setFullScreenOpen: (isOpen: boolean) => void;
  
  // Playback flow triggers (used by components to command the audio engine)
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  next: (isManual?: boolean) => Promise<void>;
  previous: () => void;
  
  // Queue Manager Actions
  removeFromQueue: (songId: string, index: number) => void;
  refillQueue: () => Promise<void>;
  setHomePageSongIds: (ids: string[]) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  progressSec: 0,
  durationSec: 0,
  volume: parseFloat(localStorage.getItem('beatmess_volume') || '0.8'),
  isShuffled: false,
  repeatMode: 'off',
  isFullScreenOpen: false,
  isGeneratingRecommendations: false,
  homePageSongIds: [],

  activeSong: () => {
    const { queue, currentIndex } = get();
    if (currentIndex >= 0 && currentIndex < queue.length) {
      return queue[currentIndex];
    }
    return null;
  },

  setQueue: (queue) => set({ queue }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setProgressSec: (progressSec) => set({ progressSec }),
  setDurationSec: (durationSec) => set({ durationSec }),
  setVolume: (volume) => {
    localStorage.setItem('beatmess_volume', volume.toString());
    set({ volume });
  },
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  cycleRepeatMode: () => set((state) => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    return { repeatMode: modes[nextIndex] };
  }),
  setFullScreenOpen: (isFullScreenOpen) => set({ isFullScreenOpen }),

  playSong: (song, newQueue) => {
    const currentQueue = newQueue || get().queue;
    let songIndex = currentQueue.findIndex((s) => s.id === song.id);

    if (songIndex === -1) {
      // Song is not in queue, add it after the active song or at the end
      const activeIdx = get().currentIndex;
      const updatedQueue = [...currentQueue];
      const insertIdx = activeIdx === -1 ? 0 : activeIdx + 1;
      updatedQueue.splice(insertIdx, 0, song);
      songIndex = insertIdx;
      set({ queue: updatedQueue, currentIndex: songIndex, isPlaying: true, progressSec: 0 });
    } else {
      // Song is already in queue
      set({ queue: currentQueue, currentIndex: songIndex, isPlaying: true, progressSec: 0 });
    }

    // Trigger queue refill check in the background
    get().refillQueue();
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  next: async (isManual = true) => {
    const { queue, currentIndex, isShuffled, repeatMode, refillQueue } = get();
    if (queue.length === 0) return;

    // Track user skip feedback if manual
    const active = get().activeSong();
    if (isManual && active) {
      const ratio = get().durationSec > 0 ? get().progressSec / get().durationSec : 0;
      try {
        const { useLibraryStore } = await import('./libraryStore');
        useLibraryStore.getState().recordInteraction(active, 'skip', ratio);
      } catch (e) {
        console.error('Failed to log skip interaction:', e);
      }
    }

    let nextIndex = currentIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex >= queue.length) {
      // Reached the end of the queue, try to refill synchronously first
      console.log('[Store Autoplay] Reached end of queue. Refilling...');
      await refillQueue();
      
      const refreshedQueue = get().queue;
      if (nextIndex < refreshedQueue.length) {
        set({ currentIndex: nextIndex, progressSec: 0, isPlaying: true });
        return;
      }
      
      nextIndex = repeatMode === 'all' ? 0 : -1;
    }

    if (nextIndex !== -1) {
      set({ currentIndex: nextIndex, progressSec: 0, isPlaying: true });
      // Trigger background refill in case upcoming tracks are low
      refillQueue();
    } else {
      set({ isPlaying: false });
    }
  },

  previous: () => {
    const { queue, currentIndex, isShuffled, repeatMode } = get();
    if (queue.length === 0) return;

    let prevIndex = currentIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = repeatMode === 'all' ? queue.length - 1 : 0;
      }
    }

    set({ currentIndex: prevIndex, progressSec: 0, isPlaying: true });
    // Trigger refill check
    get().refillQueue();
  },

  removeFromQueue: (_songId, index) => {
    const { queue, currentIndex } = get();
    if (index < 0 || index >= queue.length) return;

    const removedSong = queue[index];
    const updatedQueue = queue.filter((_, idx) => idx !== index);

    let newCurrentIdx = currentIndex;
    if (index === currentIndex) {
      // If we removed the currently playing song, play the next one at this index or play previous
      newCurrentIdx = index < updatedQueue.length ? index : updatedQueue.length - 1;
    } else if (index < currentIndex) {
      newCurrentIdx = currentIndex - 1;
    }

    set({ queue: updatedQueue, currentIndex: newCurrentIdx });

    // Record interaction as negative queue feedback
    import('./libraryStore').then(({ useLibraryStore }) => {
      useLibraryStore.getState().recordInteraction(removedSong, 'remove_from_queue');
    }).catch(e => console.error(e));

    // Refill in background if count falls below threshold
    get().refillQueue();
  },

  refillQueue: async () => {
    const { queue, currentIndex, isGeneratingRecommendations, homePageSongIds } = get();
    if (isGeneratingRecommendations) return;

    const MIN_QUEUE_SIZE = 5;
    const upcomingCount = queue.length - 1 - currentIndex;

    // Only generate if upcoming queue is running low
    if (upcomingCount >= MIN_QUEUE_SIZE) return;

    const active = get().activeSong();
    const baseSong = queue.length > 0 ? queue[queue.length - 1] : active;
    if (!baseSong) return;

    set({ isGeneratingRecommendations: true });
    console.log(`[Queue Manager] Upcoming queue size (${upcomingCount}) is below minimum (${MIN_QUEUE_SIZE}). Refilling queue in background...`);

    try {
      const { musicService } = await import('../services/musicService');
      const recommendations = await musicService.getRecommendations(baseSong, homePageSongIds);

      if (recommendations && recommendations.length > 0) {
        const currentQueue = get().queue;
        const currentIdx = get().currentIndex;
        const currentActive = get().activeSong();

        // Get unique IDs of songs in upcoming queue to avoid duplicates
        const existingIds = new Set(currentQueue.slice(currentIdx).map((s) => s.id));
        if (currentActive) existingIds.add(currentActive.id);

        const newRecs = recommendations.filter((s) => !existingIds.has(s.id));

        if (newRecs.length > 0) {
          console.log(`[Queue Manager] Successfully appended ${newRecs.length} fresh recommendations.`);
          set({ queue: [...currentQueue, ...newRecs] });
        }
      }
    } catch (e) {
      console.error('[Queue Manager] Failed to generate background recommendations:', e);
    } finally {
      set({ isGeneratingRecommendations: false });
    }
  },

  setHomePageSongIds: (homePageSongIds) => set({ homePageSongIds })
}));
