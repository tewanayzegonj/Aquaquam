import React from 'react';
import { Track, PerformanceType } from '../types';

interface TrackTableProps {
  tracks: Track[];
  currentTrackId?: string;
  onPlay: (track: Track) => void;
  isAbiyTsom: boolean;
}

const TrackTable: React.FC<TrackTableProps> = ({ tracks, currentTrackId, onPlay, isAbiyTsom }) => {
  const getVisiblePerformances = (track: Track) => {
    if (!isAbiyTsom) return track.available_performances;
    return track.available_performances.filter(p => 
      p !== PerformanceType.Tsenatsel && p !== PerformanceType.Wereb && p !== PerformanceType.Amelales
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">
            <th className="px-6 py-4 text-left font-black">HYMN <span className="ml-1 opacity-20">▼</span></th>
            <th className="px-6 py-4 text-left font-black">TYPE</th>
            <th className="px-6 py-4 text-center font-black">PERFORMANCE</th>
            <th className="px-6 py-4 text-right font-black">STATUS</th>
            <th className="px-6 py-4 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {tracks.map(track => {
            const isPlaying = currentTrackId === track.id;
            const perfs = getVisiblePerformances(track);
            
            return (
              <tr 
                key={track.id} 
                onClick={() => onPlay(track)}
                className={`group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isPlaying ? 'bg-donezo-green/5 dark:bg-donezo-green/10' : ''}`}
              >
                <td className="px-6 py-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isPlaying ? 'bg-donezo-green text-white shadow-lg shadow-donezo-green/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold truncate ${isPlaying ? 'text-donezo-green' : 'text-slate-900 dark:text-white'}`}>{track.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">mp3 • {track.merigeta_metadata.regional_school || "Gonder School"}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${isPlaying ? 'bg-donezo-green/10 text-donezo-green' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                     {track.category}
                   </span>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center justify-center -space-x-1">
                      {perfs.map((p) => (
                        <div key={p} className="w-7 h-7 rounded-full border-2 border-white dark:border-donezo-card-dark bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-600 dark:text-slate-300 uppercase" title={p}>
                          {p.charAt(0)}
                        </div>
                      ))}
                   </div>
                </td>
                <td className="px-6 py-5 text-right">
                   <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800">Available</span>
                </td>
                <td className="px-6 py-5 text-right">
                   <button className="p-2 text-slate-300 hover:text-donezo-green transition-all">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                   </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TrackTable;