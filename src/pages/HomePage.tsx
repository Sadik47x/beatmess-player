import React, { useEffect, useState } from 'react';
import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import { musicService } from '../services/musicService';
import type { Song } from '../types/song';
import { Play, Search, History } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const { playSong } = usePlayerStore();
  const { history, username } = useLibraryStore();

  const [trending, setTrending] = useState<Song[]>([]);
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [party, setParty] = useState<Song[]>([]);
  const [romance, setRomance] = useState<Song[]>([]);
  const [punjabi, setPunjabi] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchHomeContent = async () => {
      setLoading(true);
      try {
        const [trendingSongs, recommendedSongs, partySongs, romanceSongs, punjabiSongs] = await Promise.all([
          musicService.getTrendingSongs(),
          musicService.search('Lofi Chill Chillout'),
          musicService.search('Party Bollywood Hits'),
          musicService.search('Romantic Hindi Hits'),
          musicService.search('Punjabi Hits'),
        ]);
        
        // Remove .slice limits to provide unlimited horizontal scrolling rails
        setTrending(trendingSongs);
        setRecommended(recommendedSongs);
        setParty(partySongs);
        setRomance(romanceSongs);
        setPunjabi(punjabiSongs);

        const allHomeIds = [
          ...trendingSongs,
          ...recommendedSongs,
          ...partySongs,
          ...romanceSongs,
          ...punjabiSongs
        ].map(s => s.id);
        usePlayerStore.getState().setHomePageSongIds(allHomeIds);
      } catch (error) {
        console.error('Failed to load home content', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeContent();
  }, []);

  const handleSongPlay = (song: Song, rail: Song[]) => {
    playSong(song, rail);
  };

  const renderRail = (title: string, songs: Song[]) => {
    if (songs.length === 0) return null;
    return (
      <section>
        <h2 className="font-display-lg text-[18px] font-bold mb-4 text-on-surface">{title}</h2>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {songs.map((song) => (
            <div
              key={song.id}
              onClick={() => handleSongPlay(song, songs)}
              className="flex-none w-[130px] flex flex-col gap-2 group cursor-pointer"
            >
              <div className="w-[130px] h-[130px] rounded-xl overflow-hidden relative glass-image-container shadow-md group-hover:shadow-primary/20 transition-all duration-300">
                <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-violet to-accent-pink flex items-center justify-center text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="min-w-0 px-0.5">
                <h3 className="font-semibold text-sm truncate leading-tight text-on-surface group-hover:text-primary transition-colors">{song.title}</h3>
                <p className="text-[12px] text-on-surface-variant truncate mt-0.5">{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-8 overflow-y-auto h-full pb-32 hide-scrollbar">
      {/* Header: Greeting & Profile Info */}
      <header className="flex justify-between items-center mt-2">
        <div>
          <h1 className="font-headline-md text-[24px] font-bold tracking-tight text-glow">{getGreeting()}</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Welcome back, {username}</p>
        </div>
      </header>

      {/* Search Teaser Pill */}
      <div
        onClick={() => setActiveTab('search')}
        className="bg-white/[0.04] backdrop-blur-[20px] border border-white/12 rounded-full px-4 py-3 flex items-center gap-3 text-on-surface-variant shadow-sm hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Search size={18} />
        <span className="text-[14px] truncate">Search songs, artists, albums...</span>
      </div>

      {loading ? (
        /* Loading Skeleton */
        <div className="flex flex-col gap-6 animate-pulse">
          {[1, 2, 3, 4].map((railIdx) => (
            <div key={railIdx} className="flex flex-col gap-3">
              <div className="h-6 w-32 bg-white/10 rounded-md"></div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="flex-none w-[130px] flex flex-col gap-2">
                    <div className="w-[130px] h-[130px] bg-white/10 rounded-xl"></div>
                    <div className="h-4 w-20 bg-white/10 rounded"></div>
                    <div className="h-3 w-16 bg-white/10 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {renderRail('Trending Now', trending)}
          {renderRail('Punjabi Beats', punjabi)}
          {renderRail('Romantic Melodies', romance)}
          {renderRail('Party Anthems', party)}
          {renderRail('Lofi Chill Vibes', recommended)}

          {/* Recently Played */}
          {history.length > 0 && (
            <section>
              <h2 className="font-display-lg text-[18px] font-bold mb-4 text-on-surface flex items-center gap-2">
                <History size={18} className="text-primary" /> Recently Played
              </h2>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {history.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => handleSongPlay(song, history)}
                    className="flex-none w-[110px] flex flex-col gap-2 group cursor-pointer"
                  >
                    <div className="w-[110px] h-[110px] rounded-xl overflow-hidden relative glass-image-container shadow-md group-hover:shadow-primary/20 transition-all duration-300">
                      <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent-violet to-accent-pink flex items-center justify-center text-white shadow-lg">
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5">
                      <h3 className="font-semibold text-xs truncate leading-tight text-on-surface group-hover:text-primary transition-colors">{song.title}</h3>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
export default HomePage;
