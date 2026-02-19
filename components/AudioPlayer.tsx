import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Track } from '../types';

interface AudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ currentTrack, isPlaying, onTogglePlay, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Player UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // DSP State
  const [tempo, setTempo] = useState(100); 
  const [pitch, setPitch] = useState(0);   
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  
  // Interaction State
  const [isScrubbing, setIsScrubbing] = useState(false);
  const lastXRef = useRef<number>(0);

  // --- AUDIO LOGIC ---

  const waveformData = useMemo(() => {
    if (!currentTrack) return [];
    const bars = [];
    for (let i = 0; i < 3000; i++) {
        const envelope = Math.sin(i * 0.005) * 0.5 + 0.5; 
        const beat = Math.pow(Math.sin(i * 0.05), 5);
        const noise = Math.random() * 0.15;
        const val = Math.max(0.05, (envelope * 0.6 + beat * 0.4 + noise) * 0.8);
        bars.push(val);
    }
    return bars;
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || isScrubbing) return;
    const curr = audioRef.current.currentTime;
    
    if (loopA !== null && loopB !== null && loopB > loopA) {
      if (curr >= loopB) {
        audioRef.current.currentTime = loopA;
        setCurrentTime(loopA);
        return; 
      }
    }
    setCurrentTime(curr);
    if (!isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
      if (isPlaying) {
          audioRef.current.play().catch(e => console.error("Playback blocked", e));
      }
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.play().catch(() => {});
    } else {
        audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = tempo / 100;
  }, [tempo]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentTrack || !isExpanded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;
    const barWidth = 2; 
    const barGap = 1;   
    const totalBarWidth = barWidth + barGap;
    const colorPlayed = '#2dd4bf'; 
    const colorUnplayed = '#334155'; 
    const colorCenterLine = '#ffffff';

    ctx.clearRect(0, 0, width, height);

    let effectiveTime = currentTime;
    if (isPlaying && audioRef.current && !isScrubbing) {
        effectiveTime = audioRef.current.currentTime;
    }

    const durationSafe = duration || 1;
    const totalBars = waveformData.length;
    const centerIndex = (effectiveTime / durationSafe) * totalBars;
    const centerScreenX = width / 2;

    const maxVisibleBars = Math.ceil(width / totalBarWidth) + 4;
    const startDrawIndex = Math.max(0, Math.floor(centerIndex - maxVisibleBars / 2));
    const endDrawIndex = Math.min(totalBars, Math.ceil(centerIndex + maxVisibleBars / 2));

    for (let i = startDrawIndex; i < endDrawIndex; i++) {
        const val = waveformData[i];
        const barHeight = val * (height * 0.7);
        const x = centerScreenX + (i - centerIndex) * totalBarWidth;
        ctx.fillStyle = (x < centerScreenX) ? colorPlayed : colorUnplayed;
        const radius = barWidth / 2;
        const y = centerY - barHeight / 2;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
            ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
    }

    ctx.strokeStyle = colorCenterLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerScreenX, centerY - 50);
    ctx.lineTo(centerScreenX, centerY + 50);
    ctx.stroke();

    if (loopA !== null && duration > 0) {
       const loopAIndex = (loopA / duration) * totalBars;
       const xA = centerScreenX + (loopAIndex - centerIndex) * totalBarWidth;
       if (loopB !== null) {
          const loopBIndex = (loopB / duration) * totalBars;
          const xB = centerScreenX + (loopBIndex - centerIndex) * totalBarWidth;
          ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
          ctx.fillRect(xA, 0, xB - xA, height);
          ctx.strokeStyle = '#fcd34d'; 
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(xB, 0); ctx.lineTo(xB, height); ctx.stroke();
          ctx.fillStyle = '#fcd34d'; ctx.font = 'bold 10px monospace'; ctx.fillText('B', xB + 4, 15);
       }
       ctx.strokeStyle = '#2dd4bf'; 
       ctx.lineWidth = 2;
       ctx.beginPath(); ctx.moveTo(xA, 0); ctx.lineTo(xA, height); ctx.stroke();
       ctx.fillStyle = '#2dd4bf'; ctx.font = 'bold 10px monospace'; ctx.fillText('A', xA - 12, 15);
    }

  }, [waveformData, currentTrack, currentTime, duration, isPlaying, isScrubbing, loopA, loopB, isExpanded]);

  useEffect(() => {
    const loop = () => {
        if (isExpanded) drawWaveform();
        animationRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [drawWaveform, isExpanded]);

  const handleTempoChange = (val: number) => setTempo(Math.min(200, Math.max(50, val)));
  const handlePitchChange = (val: number) => setPitch(Math.min(12, Math.max(-12, val)));

  const toggleLoopA = () => {
    if (loopA === null) {
        if (loopB !== null && currentTime >= loopB) setLoopB(null);
        setLoopA(currentTime);
    } else setLoopA(null);
  }

  const toggleLoopB = () => {
    if (loopB === null) {
        if (loopA !== null && currentTime > loopA) setLoopB(currentTime);
        else if (loopA === null) setLoopB(currentTime);
    } else setLoopB(null);
  }

  const handleSeek = (val: number) => {
      const safeVal = Math.min(Math.max(0, val), duration || 100);
      setCurrentTime(safeVal);
      if (audioRef.current) audioRef.current.currentTime = safeVal;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
      setIsScrubbing(true);
      lastXRef.current = e.clientX;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isScrubbing || !duration) return;
      const deltaX = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      const totalBarWidth = 3; 
      const barsMoved = -deltaX / totalBarWidth; 
      const timeDelta = (barsMoved / waveformData.length) * duration;
      let newTime = currentTime + timeDelta;
      newTime = Math.max(0, Math.min(newTime, duration));
      setCurrentTime(newTime);
      if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      setIsScrubbing(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const formatTime = (t: number) => {
    if (isNaN(t)) return "0:00";
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* PERSISTENT AUDIO ELEMENT - Never unmounted */}
      <audio
          ref={audioRef}
          src={currentTrack.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => onTogglePlay()}
      />

      {/* MINIMIZED PLAYER UI */}
      {!isExpanded && (
        <div 
            className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl z-50 h-[84px] pb-safe cursor-pointer transition-all animate-fade-in"
            onClick={() => setIsExpanded(true)}
        >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-800">
                <div className="h-full bg-teal-400" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between px-4 h-full">
                <div className="flex items-center gap-4 overflow-hidden">
                     <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 flex-shrink-0">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-base text-white truncate">{currentTrack.title}</h4>
                        <p className="text-sm text-slate-400 truncate">{currentTrack.category}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isPlaying ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                    </button>
                    <button 
                         onClick={(e) => { e.stopPropagation(); onClose(); }}
                         className="w-8 h-8 rounded-full bg-white/10 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MAXIMIZED PLAYER UI */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] bg-[#020617] text-white flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-6 pt-safe">
                <button 
                    onClick={() => setIsExpanded(false)}
                    className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-white/10 text-slate-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-white truncate max-w-[200px]">{currentTrack.title}</h1>
                    <p className="text-xs text-teal-400 font-medium tracking-wide uppercase">{currentTrack.category}</p>
                </div>
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full active:bg-white/10 text-slate-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </div>

            <div className="px-6 space-y-6 mt-2">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium text-sm">Tempo</span>
                        <div className="flex items-center gap-3">
                            <span className="text-teal-400 font-mono font-bold text-sm">{tempo}%</span>
                            <button onClick={() => setTempo(100)} className="text-slate-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleTempoChange(tempo - 1)} className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center hover:bg-slate-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg></button>
                        <input type="range" min="50" max="150" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-teal-400" />
                        <button onClick={() => handleTempoChange(tempo + 1)} className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center hover:bg-slate-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium text-sm">Pitch</span>
                        <div className="flex items-center gap-3">
                            <span className="text-teal-400 font-mono font-bold text-sm">{pitch > 0 ? '+' : ''}{pitch.toFixed(2)}</span>
                            <button onClick={() => setPitch(0)} className="text-slate-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handlePitchChange(pitch - 0.1)} className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center hover:bg-slate-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg></button>
                        <input type="range" min="-12" max="12" step="0.1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-teal-400" />
                        <button onClick={() => handlePitchChange(pitch + 0.1)} className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center hover:bg-slate-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-400 font-medium text-sm">Loop</span>
                    <div className="flex items-center gap-4">
                         <button onClick={toggleLoopA} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border ${loopA !== null ? 'bg-teal-400 border-teal-400 text-black shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>A</button>
                         <button onClick={toggleLoopB} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border ${loopB !== null ? 'bg-amber-400 border-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>B</button>
                         <button onClick={() => { setLoopA(null); setLoopB(null); }} disabled={loopA === null && loopB === null} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-30"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative py-4 flex flex-col justify-center overflow-hidden">
                 <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 z-0"></div>
                 <canvas 
                    ref={canvasRef}
                    className="w-full h-48 md:h-64 cursor-grab active:cursor-grabbing touch-none relative z-10"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                 />
            </div>

            <div className="px-6 pb-12 pt-4 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent">
                 <div className="mb-8 flex justify-between items-end px-1">
                     <div className="text-3xl font-mono font-bold text-white tracking-tighter">{formatTime(currentTime)}</div>
                     <div className="text-sm font-mono font-medium text-slate-500 mb-1">-{formatTime(duration - currentTime)}</div>
                 </div>

                 <div className="flex items-center justify-between">
                    <button className="text-slate-500 hover:text-teal-400 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                    <div className="flex items-center gap-8">
                        <button onClick={() => handleSeek(currentTime - 15)} className="text-white hover:text-teal-400 transition-colors active:scale-95"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg></button>
                        <button onClick={onTogglePlay} className="w-20 h-20 rounded-full bg-teal-400 text-[#020617] flex items-center justify-center hover:scale-105 shadow-[0_0_30px_rgba(45,212,191,0.3)] active:scale-95">
                            {isPlaying ? <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                        </button>
                        <button onClick={() => handleSeek(currentTime + 15)} className="text-white hover:text-teal-400 transition-colors active:scale-95"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg></button>
                    </div>
                    <button className="text-slate-500 hover:text-teal-400 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></button>
                 </div>
            </div>
        </div>
      )}
    </>
  );
};

export default AudioPlayer;