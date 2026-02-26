import React from 'react';
import { Track } from '../types';

interface DashboardProps {
  currentTrack: Track | null;
  recentlyPlayed: Track[];
  favorites: Track[];
  onPlay: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentTrack, recentlyPlayed, favorites, onPlay, onToggleFavorite }) => {
  const recentFive = recentlyPlayed.slice(0, 5);
  const favoriteTen = favorites.slice(0, 10);

  return (
    <div className="p-6 md:p-10 space-y-16 animate-fade-in pb-32 max-w-7xl mx-auto">
       {/* Hero Section: Playing Now */}
       <section className="relative group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-donezo-green rounded-full"></span>
              Playing Now
            </h2>
          </div>
          
          <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 transition-all duration-500 hover:shadow-donezo-green/10">
             {/* Background Decorative Elements */}
             <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-donezo-green/5 to-transparent pointer-events-none"></div>
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-donezo-green/5 rounded-full blur-3xl pointer-events-none"></div>
             
             {currentTrack ? (
                 <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Large Track Icon/Image */}
                    <div className="relative flex-shrink-0">
                        <div className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] bg-gradient-to-br from-donezo-green to-teal-500 flex items-center justify-center shadow-2xl shadow-donezo-green/20 transform transition-transform group-hover:scale-105 duration-500">
                           <svg className="w-20 h-20 md:w-28 md:h-28 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                        </div>
                        {/* Animated Pulse Rings */}
                        <div className="absolute inset-0 rounded-[3rem] border-2 border-donezo-green animate-ping opacity-10 pointer-events-none"></div>
                    </div>

                    <div className="flex-1 text-center md:text-left min-w-0 px-4 md:px-0">
                       <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                          <span className="px-4 py-1.5 rounded-full bg-donezo-green/10 text-donezo-green text-[10px] font-black uppercase tracking-widest shadow-sm">Active Session</span>
                          <div className="flex items-end gap-1 h-4">
                              <div className="w-1 bg-donezo-green rounded-full animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                              <div className="w-1 bg-donezo-green rounded-full animate-[music-bar_1.2s_ease-in-out_infinite]"></div>
                              <div className="w-1 bg-donezo-green rounded-full animate-[music-bar_1s_ease-in-out_infinite]"></div>
                              <div className="w-1 bg-donezo-green rounded-full animate-[music-bar_0.6s_ease-in-out_infinite]"></div>
                          </div>
                       </div>
                       <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-tight break-words">
                         {currentTrack.title}
                       </h2>
                       <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium tracking-tight mb-8">
                         {currentTrack.category} • Ethiopian Orthodox Liturgy
                       </p>
                       
                       <div className="flex items-center justify-center md:justify-start gap-4">
                          <button 
                            onClick={() => onToggleFavorite(currentTrack)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all transform active:scale-95 ${
                              favorites.find(f => f.id === currentTrack.id) 
                                ? 'bg-donezo-green text-white shadow-lg shadow-donezo-green/20' 
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                            }`}
                          >
                             <svg className="w-6 h-6" fill={favorites.find(f => f.id === currentTrack.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                             </svg>
                             {favorites.find(f => f.id === currentTrack.id) ? 'Saved to Favorites' : 'Add to Favorites'}
                          </button>
                       </div>
                    </div>
                 </div>
             ) : (
                 <div className="p-20 flex flex-col items-center justify-center text-center">
                     <div className="w-24 h-24 rounded-3xl bg-slate-800 flex items-center justify-center mb-6 text-slate-600">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-2">Silence is Golden</h3>
                     <p className="text-slate-500 max-w-xs mx-auto">Select a sacred melody from your library to begin your spiritual journey.</p>
                 </div>
             )}
          </div>
       </section>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Favorites Section - Left 2/3 */}
          <section className="lg:col-span-2 space-y-8">
             <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Favorites</h2>
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{favorites.length} Tracks</span>
             </div>
             
             {favoriteTen.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     {favoriteTen.map((track) => (
                         <div 
                           key={`fav-${track.id}`}
                           onClick={() => onPlay(track)}
                           className="group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-donezo-green hover:shadow-2xl hover:shadow-donezo-green/5 transition-all cursor-pointer flex items-center gap-6"
                         >
                             <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-donezo-green group-hover:text-white transition-all flex-shrink-0 shadow-inner">
                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                             </div>
                             <div className="min-w-0 flex-1 px-2">
                                 <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight mb-1 break-words line-clamp-2">{track.title}</h4>
                                 <p className="text-xs text-slate-400 uppercase font-black tracking-widest truncate">{track.category}</p>
                             </div>
                             
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 onToggleFavorite(track);
                               }}
                               className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-donezo-green hover:bg-donezo-green hover:text-white transition-all shadow-sm"
                             >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                             </button>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="p-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                     <p className="text-slate-400 font-medium">Your heart list is empty. Add tracks to see them here.</p>
                 </div>
             )}
          </section>

          {/* Recently Played - Right 1/3 */}
          <section className="space-y-8">
             <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recent</h2>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History</span>
             </div>
             
             {recentFive.length > 0 ? (
                 <div className="space-y-4">
                     {recentFive.map((track, idx) => (
                         <div 
                           key={`recent-${track.id}-${idx}`}
                           onClick={() => onPlay(track)}
                           className="group bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-donezo-green hover:shadow-xl transition-all cursor-pointer flex items-center gap-4"
                         >
                             <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-donezo-green group-hover:text-white transition-all flex-shrink-0 font-black text-xs">
                                {idx + 1}
                             </div>
                             <div className="flex-1 min-w-0 px-2">
                                 <h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight break-words line-clamp-1">{track.title}</h4>
                                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest truncate">{track.category}</p>
                             </div>
                             <div className="text-slate-300 group-hover:text-donezo-green transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                     <p className="text-slate-400 text-sm font-medium">No history yet.</p>
                 </div>
             )}
          </section>
       </div>
    </div>
  );
};

export default Dashboard;