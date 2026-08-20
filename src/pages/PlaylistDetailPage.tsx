import React from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';
import { SongRow } from '../components/song/SongRow';
import { ArrowLeft, Play, Music, Calendar } from 'lucide-react';

export const PlaylistDetailPage: React.FC = () => {
  const { selectedPlaylistId, closeDetailView, setActiveTab } = useUIStore();
  const { playlists } = useLibraryStore();
  const { playSong } = usePlayerStore();

  const playlist = playlists.find((p) => p.id === selectedPlaylistId);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none">
        <p className="text-on-surface-variant mb-4">Playlist not found or has been deleted.</p>
        <button
          onClick={closeDetailView}
          className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold font-label-caps text-on-surface"
        >
          GO BACK
        </button>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.songs.length === 0) return;
    playSong(playlist.songs[0], playlist.songs);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col gap-6 overflow-y-auto h-full pb-32 hide-scrollbar">
      {/* Header back button */}
      <div className="flex items-center mt-2 select-none">
        <button
          onClick={closeDetailView}
          className="text-on-surface-variant hover:text-on-surface flex items-center gap-2 text-sm font-semibold hover:scale-102 active:scale-98 duration-200 transition-all"
        >
          <ArrowLeft size={18} /> Back to Library
        </button>
      </div>

      {/* Playlist Hero Info Card */}
      <div className="glass-panel border-white/5 bg-gradient-to-b from-primary/10 to-transparent p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 select-none shadow-lg">
        {/* Cover Art */}
        <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0 flex items-center justify-center shadow-2xl relative">
          {playlist.coverImageUrl ? (
            <img src={playlist.coverImageUrl} alt={playlist.title} className="w-full h-full object-cover" />
          ) : (
            <Music size={48} className="text-on-surface-variant opacity-40" />
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <span className="font-label-caps text-[10px] font-bold tracking-wider text-primary uppercase">PLAYLIST</span>
          <h1 className="font-display-lg text-2xl sm:text-3xl font-bold truncate text-on-surface mt-1 text-glow">{playlist.title}</h1>
          <p className="text-[13px] text-on-surface-variant mt-2 leading-relaxed line-clamp-2">
            {playlist.description || 'No description provided.'}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 text-[12px] text-on-surface-variant">
            <span>{playlist.songs.length} songs</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> Created {formatDate(playlist.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Songs Table Section */}
      <div className="flex flex-col gap-4">
        {playlist.songs.length > 0 ? (
          <>
            <button
              onClick={handlePlayAll}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface font-semibold text-sm hover:bg-white/10 active:scale-97 duration-200 transition-all flex items-center justify-center gap-2 select-none"
            >
              <Play size={16} fill="currentColor" /> Play Playlist
            </button>
            <div className="flex flex-col gap-3">
              {playlist.songs.map((song, idx) => (
                <SongRow key={song.id} song={song} index={idx} playlistId={playlist.id} siblings={playlist.songs} />
              ))}
            </div>
          </>
        ) : (
          <div className="glass-panel border-white/5 p-12 rounded-2xl flex flex-col items-center justify-center text-center select-none">
            <Music className="text-on-surface-variant opacity-40 mb-4" size={42} />
            <p className="font-semibold text-base text-on-surface mb-1">Playlist Empty</p>
            <p className="text-sm text-on-surface-variant max-w-xs mb-6">
              There are no songs in this playlist yet. Add songs using the context menu on song listings.
            </p>
            <button
              onClick={() => setActiveTab('search')}
              className="bg-white/5 hover:bg-white/10 text-on-surface border border-white/10 py-2.5 px-6 rounded-full font-label-caps text-[11px] font-bold tracking-wider"
            >
              FIND SONGS TO ADD
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default PlaylistDetailPage;
