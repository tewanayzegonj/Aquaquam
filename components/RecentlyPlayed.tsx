import React from 'react';
import { Track } from '../types';

interface RecentlyPlayedProps {
  tracks: Track[];
  onPlay: (track: Track) => void;
  currentTrackId?: string;
}

const RecentlyPlayed: React.FC<RecentlyPlayedProps> = ({ tracks, onPlay, currentTrackId }) => {
  if (tracks.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Recently Played</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tracks.map((track) => {
          const isPlaying = currentTrackId === track.id;
          return (
            <div 
              key={track.id}
              onClick={() => onPlay(track)}
              className={`group relative p-4 rounded-3xl border transition-all cursor-pointer hover:-translate-y-1 ${isPlaying ? 'bg-donezo-green text-white border-donezo-green shadow-lg shadow-donezo-green/30' : 'bg-white dark:bg-donezo-card-dark border-slate-100 dark:border-slate-800 hover:shadow-md'}`}
            >
              {/* Icon / Art Placeholder */}
              <div className={`w-10 h-10 rounded-2xl mb-3 flex items-center justify-center ${isPlaying ? 'bg-white/20 text-white' : 'bg-donezo-green/10 text-donezo-green group-hover:bg-donezo-green group-hover:text-white transition-colors'}`}>
                {isPlaying ? (
                  <div className="flex gap-0.5 h-3 items-end">
                    <div className="w-1 bg-white animate-[bounce_1s_infinite] h-2"></div>
                    <div className="w-1 bg-white animate-[bounce_1.2s_infinite] h-3"></div>
                    <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-1.5"></div>
                  </div>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </div>

              {/* Text Info */}
              <h3 className={`font-bold text-sm truncate mb-1 ${isPlaying ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {track.title}
              </h3>
              <p className={`text-[10px] font-medium uppercase tracking-wider truncate ${isPlaying ? 'text-white/80' : 'text-slate-400'}`}>
                {track.category}
              </p>
              
              {/* Play Overlay (Desktop) */}
              <div className="absolute inset-0 bg-black/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentlyPlayed;