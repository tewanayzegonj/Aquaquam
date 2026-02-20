import React from 'react';
import { Track } from '../types';

interface DetailsPanelProps {
  track: Track | null;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ track }) => {
  // Helper: Format Bytes to human readable string
  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown Size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Helper: Format Duration (seconds) to MM:SS
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return (
      <aside className="hidden lg:flex w-80 bg-white dark:bg-donezo-card-dark border-l border-slate-200 dark:border-slate-800 flex-col flex-shrink-0 h-full p-8 items-center justify-center text-center text-slate-400">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-sm font-medium">No Track Selected</p>
        <p className="text-xs opacity-60">Please select a track from the list to view details.</p>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-80 bg-white dark:bg-donezo-card-dark border-l border-slate-200 dark:border-slate-800 flex-col flex-shrink-0 h-full overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bold text-slate-800 dark:text-white uppercase tracking-widest text-[10px]">TRACK DETAILS</h2>
          <button className="text-slate-300 hover:text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Source Meta */}
        <div className="mb-8">
          <div className="w-full aspect-square bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-500 mb-4 shadow-inner border border-blue-100/50 dark:border-slate-700">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          </div>
          <h3 className="text-lg font-serif font-bold text-donezo-green mb-1">{track.title}</h3>
          <p className="text-xs text-slate-400 mb-4">{formatSize(track.size)} • {formatDuration(track.duration)}</p>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">School (Regional)</p>
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                {track.merigeta_metadata.regional_school || 'General'}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tempo</p>
              <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                {track.merigeta_metadata.tempo || 'Moderate'}
              </div>
            </div>
            {track.merigeta_metadata.notes && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 px-3 py-2 rounded-xl text-xs text-yellow-800 dark:text-yellow-500 border border-yellow-100 dark:border-yellow-900/20 italic">
                  "{track.merigeta_metadata.notes}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Types</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {track.available_performances.map(p => (
              <span key={p} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md uppercase">{p}</span>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex space-x-4">
               <button className="text-[10px] font-bold text-slate-800 dark:text-white border-b-2 border-slate-800 dark:border-white pb-2">Activity</button>
               <button className="text-[10px] font-bold text-slate-400 pb-2">Comments</button>
            </div>
          </div>
          
          <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
            <div className="relative pl-6">
              <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-donezo-card-dark bg-blue-500"></div>
              <p className="text-[10px] text-slate-400 mb-1">Yesterday</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Merigeta <span className="text-blue-500">Zimame</span> added a note</p>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-donezo-card-dark bg-slate-300"></div>
              <p className="text-[10px] text-slate-400 mb-1">April 18, 2024</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium text-slate-500">Audio file verification completed</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DetailsPanel;