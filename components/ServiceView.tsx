import React from 'react';
import { DayData, ServiceSection, Track, LiturgicalCategory } from '../types';
import TrackItem from './TrackItem';

interface ServiceViewProps {
  day: DayData;
  activeService: ServiceSection;
  onTabChange: (section: ServiceSection) => void;
  isAbiyTsom: boolean;
  isSunday: boolean;
  currentTrackId?: string;
  onPlayTrack: (track: Track) => void;
  onBack: () => void;
}

const ServiceView: React.FC<ServiceViewProps> = ({ 
  day, 
  activeService, 
  onTabChange, 
  isAbiyTsom, 
  isSunday, 
  currentTrackId,
  onPlayTrack,
  onBack
}) => {

  // --- LITURGICAL RULES ENGINE ---
  const sortAndFilterTracks = (tracks: Track[], section: ServiceSection): Track[] => {
    let sequence: string[] = [];

    if (section === ServiceSection.Wazema) {
      sequence = [
        LiturgicalCategory.Mahtew,
        LiturgicalCategory.Wazema,
        LiturgicalCategory.Yitbarek,
        LiturgicalCategory.Qine,
        LiturgicalCategory.Selam
      ];
    } else {
      // Mahlet Base Sequence
      sequence = [
        LiturgicalCategory.Sebuh,
        LiturgicalCategory.Melk,
        LiturgicalCategory.Wereb,
        LiturgicalCategory.Ziq,
        LiturgicalCategory.Wereb,
        LiturgicalCategory.Esmelealem,
        LiturgicalCategory.Mltan
      ];

      // Conditional: Hyente Ezl vs Ezl
      if (day.isMajorChristFeast) {
        sequence.push(LiturgicalCategory.HyenteEzl);
      } else {
        sequence.push(LiturgicalCategory.Ezl);
      }

      sequence.push(LiturgicalCategory.Abun);
      sequence.push(LiturgicalCategory.Selam);

      // Conditional: Sunday Weekly Mezmur
      if (isSunday) {
        sequence.push(LiturgicalCategory.WeeklyMezmur);
      }
    }

    // Sort tracks based on the defined sequence index
    const sorted = tracks
      .filter(t => sequence.includes(t.category))
      .sort((a, b) => sequence.indexOf(a.category) - sequence.indexOf(b.category));

    return sorted;
  };

  const rawTracks = activeService === ServiceSection.Wazema ? day.wazemaTracks : day.mahletTracks;
  const displayTracks = sortAndFilterTracks(rawTracks, activeService);

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Fixed Header Section */}
      <div className="bg-eotc-red text-eotc-cream shadow-md z-10 flex-shrink-0">
        <div className="p-4">
          {/* Mobile Back Button - Hidden on Desktop */}
          <button 
            onClick={onBack} 
            className="md:hidden flex items-center text-sm mb-2 hover:text-white/80 transition-opacity"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to List
          </button>
          
          <h1 className="text-xl md:text-2xl font-serif font-bold">{day.name}</h1>
          <div className="flex flex-wrap items-center text-xs opacity-90 gap-2 mt-1">
            {day.isMajorChristFeast && <span className="bg-eotc-gold text-eotc-dark px-2 py-0.5 rounded font-medium">Major Feast</span>}
            {isSunday && <span className="bg-white/20 px-2 py-0.5 rounded">Sunday</span>}
            {isAbiyTsom && <span className="bg-white/20 px-2 py-0.5 rounded">Abiy Tsom</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-eotc-red/20">
          <button 
            onClick={() => onTabChange(ServiceSection.Wazema)}
            className={`flex-1 py-3 text-sm md:text-base font-serif font-bold transition-colors ${activeService === ServiceSection.Wazema ? 'bg-white text-eotc-red' : 'bg-eotc-red hover:bg-red-900 text-eotc-cream/70'}`}
          >
            Wazema (Eve)
          </button>
          <button 
            onClick={() => onTabChange(ServiceSection.Mahlet)}
            className={`flex-1 py-3 text-sm md:text-base font-serif font-bold transition-colors ${activeService === ServiceSection.Mahlet ? 'bg-white text-eotc-red' : 'bg-eotc-red hover:bg-red-900 text-eotc-cream/70'}`}
          >
            Mahlet (Dawn)
          </button>
        </div>
      </div>

      {/* Scrollable Track List */}
      <div className="flex-1 overflow-y-auto bg-stone-50">
        <div className="p-4 space-y-2 pb-24">
          {displayTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3 2zm0 0v-8" /></svg>
              <p>No tracks in this sequence.</p>
            </div>
          ) : (
            displayTracks.map(track => (
              <TrackItem 
                key={track.id} 
                track={track} 
                onPlay={onPlayTrack} 
                isAbiyTsom={isAbiyTsom}
                isPlaying={currentTrackId === track.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceView;