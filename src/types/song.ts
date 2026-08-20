export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string;      // URL of the album cover art
  mediaUrl: string;   // Audio stream URL (mp3/mp4)
  duration: number;   // Song duration in seconds
  lyrics?: string;    // Song lyrics text, if available
  language?: string;  // Song language
  year?: string;      // Release year
}
