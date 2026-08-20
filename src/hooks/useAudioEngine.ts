import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import { musicService } from '../services/musicService';

// Global mutable callbacks to prevent stale closures in YT events
let ytEndedCallback: (() => void) | null = null;
let ytReadyCallback: (() => void) | null = null;
let ytPlayer: any = null;

function initYtPlayer(): Promise<any> {
  return new Promise((resolve) => {
    if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
      resolve(ytPlayer);
      return;
    }

    const checkAndInit = () => {
      const YT = (window as any).YT;
      if (YT && YT.Player) {
        if (!ytPlayer) {
          ytPlayer = new YT.Player('yt-player-placeholder', {
            height: '1',
            width: '1',
            videoId: '',
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              showinfo: 0,
              modestbranding: 1
            },
            events: {
              onReady: () => {
                if (ytReadyCallback) ytReadyCallback();
                resolve(ytPlayer);
              },
              onStateChange: (event: any) => {
                // YT.PlayerState.ENDED is 0
                if (event.data === 0) {
                  if (ytEndedCallback) ytEndedCallback();
                }
              }
            }
          });
        } else {
          // If ytPlayer exists but is not ready yet, poll for its API methods to load
          const pollReady = () => {
            if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
              resolve(ytPlayer);
            } else {
              setTimeout(pollReady, 50);
            }
          };
          pollReady();
        }
      } else {
        setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();
  });
}

export const useAudioEngine = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const {
    isPlaying,
    volume,
    currentIndex,
    queue,
    setIsPlaying,
    setProgressSec,
    setDurationSec,
    next,
    setQueue,
  } = usePlayerStore();

  const { addToHistory } = useLibraryStore();

  // Get active song directly
  const activeSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Use a mutable ref to store the latest state variables.
  // This avoids re-registering event listeners and prevents stale closure issues entirely.
  const stateRef = useRef({ activeSong, queue, currentIndex, next, setQueue, setIsPlaying });
  useEffect(() => {
    stateRef.current = { activeSong, queue, currentIndex, next, setQueue, setIsPlaying };
  });

  // Autoplay recommendations when current song finishes
  const handleTrackEnded = async () => {
    const { activeSong: curSong, next: skipNext } = stateRef.current;
    
    if (curSong) {
      try {
        // Record completed listen feedback
        const { useLibraryStore } = await import('../stores/libraryStore');
        useLibraryStore.getState().recordInteraction(curSong, 'complete');
      } catch (err) {
        console.error('Failed to log completion interaction:', err);
      }
    }
    // Standard skip next (not manual user skip)
    skipNext(false);
  };

  // Update global callbacks on render to always use fresh actions
  useEffect(() => {
    ytEndedCallback = () => {
      handleTrackEnded();
    };
  }, []);

  useEffect(() => {
    ytReadyCallback = () => {
      if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
        ytPlayer.setVolume(Math.round(volume * 100));
      }
    };
  }, [volume]);

  // Initialize HTML5 Audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Sync Volume to both players
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      try {
        ytPlayer.setVolume(Math.round(volume * 100));
      } catch (e) {}
    }
  }, [volume]);

  // Interval timer for syncing YouTube Player progress
  useEffect(() => {
    let intervalId: any = null;

    if (activeSong && activeSong.id.startsWith('yt-') && isPlaying) {
      intervalId = setInterval(() => {
        if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
          try {
            setProgressSec(ytPlayer.getCurrentTime());
            const dur = ytPlayer.getDuration();
            if (dur) setDurationSec(dur);
          } catch (e) {
            // Player might not be fully ready
          }
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeSong, isPlaying]);

  // Sync Source (Song change + Play/Pause coordination)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const loadAndPlay = async () => {
      if (activeSong) {
        const isYt = activeSong.id.startsWith('yt-');

        if (isYt) {
          // Pause HTML5 audio and clear source to prevent empty-source error triggers
          audio.pause();
          audio.src = '';

          // Extract YouTube ID
          const videoId = activeSong.id.replace('yt-', '');

          // Get or init YT player
          const player = await initYtPlayer();

          if (player) {
            // Verify if we need to load a new video
            const currentVideoUrl = player.getVideoUrl ? player.getVideoUrl() : '';
            const isNewSource = !currentVideoUrl.includes(videoId);

            if (isNewSource) {
              setProgressSec(0);
              setDurationSec(activeSong.duration || 180);
              try {
                player.loadVideoById({
                  videoId: videoId,
                  startSeconds: 0
                });
              } catch (e) {
                console.error('Failed to load video:', e);
              }
              // Log history
              addToHistory(activeSong);
            }

            if (isPlaying) {
              try {
                player.playVideo();
              } catch (e) {}
            } else {
              try {
                player.pauseVideo();
              } catch (e) {}
            }
          }
        } else {
          // Pause YT player if it exists
          if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            try {
              ytPlayer.pauseVideo();
            } catch (e) {}
          }

          let streamUrl = activeSong.mediaUrl;
          if (!streamUrl) {
            console.log(`[Audio Engine] Resolving dynamic JioSaavn stream URL for: "${activeSong.title}"`);
            try {
              const searchResults = await musicService.search(`${activeSong.title} ${activeSong.artist}`);
              if (searchResults && searchResults[0] && searchResults[0].mediaUrl) {
                streamUrl = searchResults[0].mediaUrl;
                activeSong.mediaUrl = streamUrl; // Cache it on the object
                if (searchResults[0].lyrics) {
                  activeSong.lyrics = searchResults[0].lyrics; // Cache lyrics too
                }
              } else {
                throw new Error('No search result found on JioSaavn for trending track');
              }
            } catch (err) {
              console.error('[Audio Engine] Failed to resolve trending song mediaUrl:', err);
              stateRef.current.setIsPlaying(false);
              return;
            }
          }

          const isNewSource = audio.src !== streamUrl;
          if (isNewSource) {
            audio.src = streamUrl;
            audio.load();
            setProgressSec(0);
            addToHistory(activeSong);
          }

          if (isPlaying) {
            try {
              await audio.play();
            } catch (err) {
              console.error('Audio play failed:', err);
              stateRef.current.setIsPlaying(false);
            }
          } else {
            audio.pause();
          }
        }
      } else {
        // Stop both
        audio.pause();
        audio.src = '';
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
          try {
            ytPlayer.pauseVideo();
          } catch (e) {}
        }
      }
    };

    loadAndPlay();
  }, [activeSong, isPlaying]);

  // Audio element event listeners (Only handle non-YouTube tracks)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const { activeSong: curSong } = stateRef.current;
      if (curSong && !curSong.id.startsWith('yt-')) {
        setProgressSec(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      const { activeSong: curSong } = stateRef.current;
      if (curSong && !curSong.id.startsWith('yt-')) {
        setDurationSec(audio.duration);
      }
    };

    const handleEnded = () => {
      const { activeSong: curSong } = stateRef.current;
      if (curSong && !curSong.id.startsWith('yt-')) {
        handleTrackEnded();
      }
    };

    const handleError = (e: any) => {
      // CRITICAL: Only set playing to false if we are currently playing a JioSaavn track.
      // This prevents empty-source HTML5 audio error events from interrupting YouTube playback.
      const { activeSong: curSong, setIsPlaying: updatePlayState } = stateRef.current;
      if (curSong && !curSong.id.startsWith('yt-')) {
        console.error('Audio engine playback error:', e);
        updatePlayState(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [setDurationSec, setProgressSec]);



  // Expose seek function
  const seekAudio = (sec: number) => {
    if (activeSong && activeSong.id.startsWith('yt-')) {
      if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
        try {
          ytPlayer.seekTo(sec, true);
          setProgressSec(sec);
        } catch (e) {}
      }
    } else {
      const audio = audioRef.current;
      if (audio && audio.src) {
        audio.currentTime = sec;
        setProgressSec(sec);
      }
    }
  };

  return { seekAudio };
};

export type AudioEngine = ReturnType<typeof useAudioEngine>;
