import React, { useState } from 'react';
import { Track, PerformanceType } from '../types';

interface TrackItemProps {
  track: Track;
  onPlay: (track: Track) => void;
  isAbiyTsom: boolean;
  isPlaying: boolean;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onPlay, isAbiyTsom, isPlaying }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Seasonal Logic Filter
  const filterPerformances = (perfs: PerformanceType[]) => {
    if (!isAbiyTsom) return perfs;
    return perfs.filter(p => 
      p !== PerformanceType.Tsenatsel && 
      p !== PerformanceType.Wereb && 
      p !== PerformanceType.Amelales
    );
  };

  const visiblePerformances = filterPerformances(track.available_performances);
  const hasMetadata = Object.keys(track.merigeta_metadata).length > 0;

  return (
    <div className={`p-3 rounded-lg border transition-all ${isPlaying ? 'bg-amber-50 border-eotc-gold shadow-sm' : 'bg-white border-stone-200 hover:border-stone-300'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-serif text-lg ${isPlaying ? 'text-eotc-gold font-bold' : 'text-eotc-red'}`}>{track.title}</h4>
            {hasMetadata && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                className="text-stone-400 hover:text-eotc-gold transition-colors p-1"
                aria-label="Toggle metadata"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            )}
          </div>
          
          {/* Metadata Card */}
          {showInfo && (
            <div className="mt-2 mb-2 p-3 bg-stone-50 rounded-md text-sm text-stone-700 border border-stone-100">
                <p className="font-semibold text-eotc-red text-[10px] uppercase tracking-wider mb-1">Merigeta Notes</p>
                {track.merigeta_metadata.regional_school && <p><span className="text-stone-500">School:</span> {track.merigeta_metadata.regional_school}</p>}
                {track.merigeta_metadata.tempo && <p><span className="text-stone-500">Tempo:</span> {track.merigeta_metadata.tempo}</p>}
                {track.merigeta_metadata.notes && <p className="mt-1 italic text-stone-600">"{track.merigeta_metadata.notes}"</p>}
            </div>
          )}

          {/* Performance Buttons */}
          <div className="mt-2 flex flex-wrap gap-2">
            {visiblePerformances.length > 0 ? visiblePerformances.map((perf) => (
              <button
                key={perf}
                onClick={() => onPlay(track)}
                className="px-3 py-1 text-xs font-medium rounded-full border border-eotc-gold/30 bg-eotc-cream/50 text-eotc-red hover:bg-eotc-gold hover:text-white transition-colors"
              >
                {perf}
              </button>
            )) : (
              <button
                onClick={() => onPlay(track)}
                 className="px-3 py-1 text-xs font-medium rounded-full border border-stone-300 text-stone-500 hover:bg-stone-200 transition-colors"
              >
                Play Standard
              </button>
            )}
          </div>
        </div>
        
        {/* Play Icon Indicator */}
        <button 
          onClick={() => onPlay(track)}
          className={`ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-eotc-gold text-white' : 'bg-stone-100 text-stone-400 hover:bg-eotc-red hover:text-white'}`}
        >
          {isPlaying ? (
             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
             <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default TrackItem;