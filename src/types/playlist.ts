import type { Song } from './song';

export interface Playlist {
  id: string;
  title: string;
  description: string;
  songs: Song[];
  coverImageUrl?: string; // Optional cover image URL
  createdAt: string;
}
