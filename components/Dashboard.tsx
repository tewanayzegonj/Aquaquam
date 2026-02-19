import React from 'react';
import { Track } from '../types';

interface DashboardProps {
  currentTrack: Track | null;
  recentlyPlayed: Track[];
  onPlay: (track: Track) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentTrack, recentlyPlayed, onPlay }) => {
  return (
    <div className="p-6 md:p-10 space-y-12 animate-fade-in pb-32">
       {/* Top Stats Row - Now only showing Now Playing for a cleaner focal point */}
       <div className="max-w-5xl">
          {/* Now Playing Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 border border-slate-700 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow min-h-[160px]">
             {currentTrack ? (
                 <>
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                         <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><path fill="#10b981" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,31.7C59,41.9,47.1,49.5,35.4,55.3C23.7,61.1,12.2,65.1,-0.6,66.1C-13.4,67.1,-25.5,65.1,-36.8,59.2C-48.1,53.3,-58.6,43.5,-67.6,31.6C-76.6,19.7,-84.1,5.7,-82.9,-7.8C-81.7,-21.3,-71.8,-34.3,-60.7,-43.3C-49.6,-52.3,-37.3,-57.3,-25.1,-65.3C-12.9,-73.3,1.9,-84.3,14.6,-81.8C27.3,-79.3,50.7,-63.3,44.7,-76.4Z" transform="translate(100 100)" /></svg>
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start mb-4">
                           <span className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold uppercase tracking-widest text-donezo-green backdrop-blur-md">Now Playing</span>
                           <div className="animate-pulse flex gap-1">
                               <div className="w-1 h-3 bg-donezo-green rounded-full"></div>
                               <div className="w-1 h-5 bg-donezo-green rounded-full"></div>
                               <div className="w-1 h-2 bg-donezo-green rounded-full"></div>
                           </div>
                        </div>
                        <div>
                           <h2 className="text-3xl font-bold truncate mb-1 tracking-tight">{currentTrack.title}</h2>
                           <p className="text-slate-400 text-sm truncate font-medium">{currentTrack.category}</p>
                        </div>
                    </div>
                 </>
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 pt-4">
                     <p className="font-bold uppercase tracking-widest text-xs">Not Playing</p>
                     <p className="text-[10px]">Select a track to start</p>
                 </div>
             )}
          </div>
       </div>

       {/* Recently Played */}
       <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Recently Played</h2>
          </div>
          
          {recentlyPlayed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {recentlyPlayed.map((track, idx) => (
                      <div 
                        key={`${track.id}-${idx}`}
                        onClick={() => onPlay(track)}
                        className="group bg-white dark:bg-donezo-card-dark p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-donezo-green hover:shadow-xl hover:shadow-donezo-green/5 transition-all cursor-pointer flex items-center gap-4"
                      >
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-donezo-green group-hover:text-white transition-all flex-shrink-0">
                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                          <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm tracking-tight">{track.title}</h4>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">{track.category}</p>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="p-12 text-center bg-white dark:bg-donezo-card-dark rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 text-sm font-medium">Your recently played tracks will appear here.</p>
              </div>
          )}
       </div>
    </div>
  );
};

export default Dashboard;