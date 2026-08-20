import React, { useState } from 'react';
import type { Song } from '../../types/song';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { useUIStore } from '../../stores/uiStore';
import { Heart, Play, MoreVertical, Plus, Trash2, ListMusic } from 'lucide-react';

interface SongRowProps {
  song: Song;
  index: number;
  playlistId?: string; // If rendered inside a playlist details page
  siblings?: Song[]; // Siblings to be queued up when playing this song
}

export const SongRow: React.FC<SongRowProps> = ({ song, index, playlistId, siblings }) => {
  const { playSong, activeSong, isPlaying, togglePlay, queue, setQueue } = usePlayerStore();
  const { toggleLike, isLiked, playlists, addSongToPlaylist, removeSongFromPlaylist } = useLibraryStore();
  const { showToast } = useUIStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const isCurrent = activeSong()?.id === song.id;
  const liked = isLiked(song.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, siblings || [song]);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(song);
    showToast(isLiked(song.id) ? 'Added to Liked Songs' : 'Removed from Liked Songs', 'info');
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentQueue = [...queue];
    if (currentQueue.some(s => s.id === song.id)) {
      showToast('Song already in queue', 'info');
    } else {
      setQueue([...currentQueue, song]);
      showToast('Added to Queue', 'success');
    }
    setShowDropdown(false);
  };

  const handleAddToPlaylist = (e: React.MouseEvent, pId: string, pTitle: string) => {
    e.stopPropagation();
    addSongToPlaylist(pId, song);
    showToast(`Added to "${pTitle}"`, 'success');
    setShowDropdown(false);
  };

  const handleRemoveFromPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlistId) {
      removeSongFromPlaylist(playlistId, song.id);
      showToast('Removed from playlist', 'success');
    }
    setShowDropdown(false);
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`glass-panel border-white/5 rounded-xl p-3 flex items-center gap-4 hover:bg-white/5 transition-all duration-200 cursor-pointer group relative ${
        isCurrent ? 'border-primary/20 bg-primary/5' : ''
      } ${showDropdown ? 'z-40' : 'z-10'}`}
    >
      {/* Index / Play Button */}
      <div className="w-6 h-6 flex items-center justify-center text-on-surface-variant font-label-caps relative">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-full bg-accent-violet rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }}></span>
            <span className="w-0.5 h-3/4 bg-accent-pink rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }}></span>
            <span className="w-0.5 h-full bg-accent-violet rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.7s' }}></span>
          </div>
        ) : (
          <>
            <span className="group-hover:hidden">{index + 1}</span>
            <Play size={16} className="hidden group-hover:block text-primary" />
          </>
        )}
      </div>

      {/* Album Art */}
      <div className="w-12 h-12 rounded-lg overflow-hidden relative glass-image-container flex-shrink-0 bg-surface-container">
        <img src={song.image} alt={song.title} className="w-full h-full object-cover" />
      </div>

      {/* Metadata */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-[15px] truncate transition-colors ${
          isCurrent ? 'text-primary' : 'text-on-surface'
        }`}>
          {song.title}
        </p>
        <p className="text-[13px] text-on-surface-variant truncate">{song.artist}</p>
      </div>

      {/* Album (Hidden on mobile) */}
      <div className="hidden md:block flex-1 text-[13px] text-on-surface-variant truncate">
        {song.album}
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-3 flex-shrink-0 relative">
        <button
          onClick={handleLikeClick}
          className={`hover:scale-110 active:scale-95 duration-200 transition-transform ${
            liked ? 'text-accent-pink' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
        </button>

        <span className="text-[13px] text-on-surface-variant">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-white/5 active:scale-95 duration-200"
        >
          <MoreVertical size={16} />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }}></div>
            <div className={`absolute right-0 ${index >= 3 ? 'bottom-8' : 'top-8'} z-50 w-52 glass-panel bg-surface-container border-white/12 rounded-xl py-2 shadow-2xl flex flex-col`}>
              
              {/* Add to Queue Button */}
              <button
                onClick={handleAddToQueue}
                className="px-4 py-2 hover:bg-white/5 text-[13px] text-left text-on-surface flex items-center gap-2 border-b border-white/5"
              >
                <Plus size={14} /> Add to Queue
              </button>

              {playlists.length > 0 && (
                <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-on-surface-variant uppercase border-b border-white/5 flex items-center gap-1.5 mt-1 select-none">
                  <ListMusic size={12} /> Add to Playlist
                </div>
              )}
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={(e) => handleAddToPlaylist(e, p.id, p.title)}
                  className="px-4 py-2 hover:bg-white/5 text-[13px] text-left text-on-surface flex items-center gap-2 truncate"
                >
                  <Plus size={14} className="flex-shrink-0" />
                  <span className="truncate">{p.title}</span>
                </button>
              ))}

              {playlistId ? (
                <button
                  onClick={handleRemoveFromPlaylist}
                  className="px-4 py-2 hover:bg-red-500/10 hover:text-red-400 text-[13px] text-left text-red-300 flex items-center gap-2 border-t border-white/5 mt-1"
                >
                  <Trash2 size={14} /> Remove from Playlist
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default SongRow;
