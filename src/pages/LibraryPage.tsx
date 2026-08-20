import React, { useState } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useUIStore } from '../stores/uiStore';
import { SongRow } from '../components/song/SongRow';
import { Heart, ListMusic, History, Plus, Play, Music, FolderPlus, X, Trash2 } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const { likedSongs, playlists, history, createPlaylist, deletePlaylist, clearHistory } = useLibraryStore();
  const { playSong } = usePlayerStore();
  const { openPlaylist, setActiveTab } = useUIStore();
  
  const [activeSubTab, setActiveSubTab] = useState<'liked' | 'playlists' | 'history'>('liked');
  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createPlaylist(newTitle, newDesc);
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const handlePlayAllLiked = () => {
    if (likedSongs.length === 0) return;
    playSong(likedSongs[0], likedSongs);
  };

  return (
    <div className="flex flex-col gap-6 overflow-y-auto h-full pb-32 hide-scrollbar">
      {/* Header & Create Playlist button */}
      <header className="flex justify-between items-center mt-2 select-none">
        <h1 className="font-headline-md text-[24px] font-bold tracking-tight text-glow">Your Library</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-accent-violet to-accent-pink hover:scale-105 active:scale-95 duration-200 transition-transform text-white font-label-caps text-[11px] font-bold tracking-wider py-2.5 px-4 rounded-full flex items-center gap-1.5 shadow-md shadow-violet-500/10 border border-white/10"
        >
          <Plus size={14} /> NEW PLAYLIST
        </button>
      </header>

      {/* Tab Switchers */}
      <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-full select-none">
        <button
          onClick={() => setActiveSubTab('liked')}
          className={`flex-1 py-2 rounded-full font-label-caps text-xs font-semibold flex items-center justify-center gap-1.5 duration-200 transition-all ${
            activeSubTab === 'liked'
              ? 'bg-gradient-to-r from-accent-violet/20 to-accent-pink/20 text-primary border border-primary/20 shadow-inner'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Heart size={14} fill={activeSubTab === 'liked' ? 'currentColor' : 'none'} />
          <span>Liked Songs</span>
        </button>
        <button
          onClick={() => setActiveSubTab('playlists')}
          className={`flex-1 py-2 rounded-full font-label-caps text-xs font-semibold flex items-center justify-center gap-1.5 duration-200 transition-all ${
            activeSubTab === 'playlists'
              ? 'bg-gradient-to-r from-accent-violet/20 to-accent-pink/20 text-primary border border-primary/20 shadow-inner'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <ListMusic size={14} />
          <span>Playlists</span>
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 rounded-full font-label-caps text-xs font-semibold flex items-center justify-center gap-1.5 duration-200 transition-all ${
            activeSubTab === 'history'
              ? 'bg-gradient-to-r from-accent-violet/20 to-accent-pink/20 text-primary border border-primary/20 shadow-inner'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <History size={14} />
          <span>History</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1">
        {activeSubTab === 'liked' && (
          <div className="flex flex-col gap-4">
            {likedSongs.length > 0 ? (
              <>
                <button
                  onClick={handlePlayAllLiked}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface font-semibold text-sm hover:bg-white/10 active:scale-97 duration-200 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Play All Liked Songs
                </button>
                <div className="flex flex-col gap-3">
                  {likedSongs.map((song, idx) => (
                    <SongRow key={song.id} song={song} index={idx} siblings={likedSongs} />
                  ))}
                </div>
              </>
            ) : (
              <div className="glass-panel border-white/5 p-12 rounded-2xl flex flex-col items-center justify-center text-center">
                <Heart className="text-on-surface-variant opacity-40 mb-4" size={42} />
                <p className="font-semibold text-base text-on-surface mb-1">No Liked Songs</p>
                <p className="text-sm text-on-surface-variant max-w-xs mb-6">
                  Songs you like will show up here. Start exploring the latest catalog!
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="bg-white/5 hover:bg-white/10 text-on-surface border border-white/10 py-2.5 px-6 rounded-full font-label-caps text-[11px] font-bold tracking-wider"
                >
                  FIND SOMETHING TO PLAY
                </button>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'playlists' && (
          <div className="grid grid-cols-2 gap-4 select-none">
            {/* Dashed Create Card */}
            <div
              onClick={() => setShowCreateModal(true)}
              className="glass-panel border-dashed border-white/20 bg-white/[0.01] hover:bg-white/[0.04] rounded-2xl flex flex-col items-center justify-center aspect-[1.1/1] cursor-pointer hover:border-white/30 transition-all duration-200"
            >
              <FolderPlus size={32} className="text-on-surface-variant opacity-60 mb-2" />
              <span className="font-bold text-xs text-on-surface-variant font-label-caps tracking-wider">CREATE PLAYLIST</span>
            </div>

            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => openPlaylist(playlist.id)}
                className="glass-panel border-white/5 p-3 rounded-2xl flex flex-col gap-3 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
              >
                {/* Cover Art */}
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface-container relative flex items-center justify-center shadow-inner">
                  {playlist.coverImageUrl ? (
                    <img src={playlist.coverImageUrl} alt={playlist.title} className="w-full h-full object-cover" />
                  ) : (
                    <Music size={40} className="text-on-surface-variant opacity-40" />
                  )}
                  {playlist.songs.length > 0 && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-violet to-accent-pink flex items-center justify-center text-white shadow-lg">
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                {/* Metadata & Actions */}
                <div className="flex justify-between items-start min-w-0">
                  <div className="min-w-0 flex-1 pr-1">
                    <h3 className="font-semibold text-sm truncate text-on-surface group-hover:text-primary transition-colors">{playlist.title}</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{playlist.songs.length} songs</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${playlist.title}"?`)) {
                        deletePlaylist(playlist.id);
                      }
                    }}
                    className="text-on-surface-variant hover:text-red-400 p-1.5 rounded-full hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'history' && (
          <div className="flex flex-col gap-4">
            {history.length > 0 ? (
              <>
                <button
                  onClick={clearHistory}
                  className="w-full py-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 text-red-300 font-semibold text-sm active:scale-97 duration-200 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Clear Listening History
                </button>
                <div className="flex flex-col gap-3">
                  {history.map((song, idx) => (
                    <SongRow key={idx} song={song} index={idx} siblings={history} />
                  ))}
                </div>
              </>
            ) : (
              <div className="glass-panel border-white/5 p-12 rounded-2xl flex flex-col items-center justify-center text-center select-none">
                <History className="text-on-surface-variant opacity-40 mb-4" size={42} />
                <p className="font-semibold text-base text-on-surface mb-1">No Listening History</p>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  Your recently played songs will show up here. Go play some music!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Playlist Modal overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm select-none">
          <div className="fixed inset-0" onClick={() => setShowCreateModal(false)}></div>
          <form
            onSubmit={handleCreatePlaylist}
            className="glass-panel border-white/12 bg-surface/90 w-full max-w-sm rounded-[24px] p-6 shadow-2xl relative z-10 animate-fade-in flex flex-col gap-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h2 className="font-headline-md text-base font-bold text-on-surface">New Playlist</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase font-label-caps">Playlist Name</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="My Awesome Playlist"
                className="bg-white/[0.04] border border-white/12 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase font-label-caps">Description (Optional)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Give your playlist some vibe..."
                rows={3}
                className="bg-white/[0.04] border border-white/12 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-accent-violet to-accent-pink py-3 rounded-full text-white font-label-caps text-xs font-bold tracking-wider hover:scale-103 active:scale-97 duration-200 transition-all border border-white/10"
            >
              CREATE PLAYLIST
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default LibraryPage;
