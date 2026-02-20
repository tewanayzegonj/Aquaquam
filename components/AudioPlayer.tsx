import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Track } from '../types';

interface AudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

interface ExtendedAudioElement extends HTMLAudioElement {
  mozPreservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ currentTrack, isPlaying, onTogglePlay, onClose }) => {
  const audioRef = useRef<ExtendedAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Player Settings / State
  const [seekAmount] = useState(10);

  // DSP State
  const [tempo] = useState(100); 
  const [pitch] = useState(0);   
  
  // Interaction State
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  // Generate consistent waveform data
  const waveformData = useMemo(() => {
    if (!currentTrack) return [];
    const bars = [];
    const totalBars = 200; 
    for (let i = 0; i < totalBars; i++) {
        // Perlin-ish noise for visual
        const x = i / 8;
        const base = Math.sin(x) * 0.5 + 0.5;
        const noise = Math.random() * 0.5;
        const val = Math.max(0.1, (base + noise) * 0.7);
        bars.push(val);
    }
    return bars;
  }, [currentTrack]);

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback error:", e));
    } else {
        audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle DSP (Tempo/Pitch)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let rate = 1.0;
    let shouldPreservePitch = true;

    if (pitch !== 0) {
        rate = Math.pow(2, pitch / 12);
        shouldPreservePitch = false; 
    } else {
        rate = tempo / 100;
        shouldPreservePitch = true;
    }

    audio.playbackRate = Math.max(0.0625, Math.min(16, rate));

    if ('preservesPitch' in audio) {
        (audio as any).preservesPitch = shouldPreservePitch;
    } else if (audio.mozPreservesPitch !== undefined) {
        audio.mozPreservesPitch = shouldPreservePitch;
    } else if (audio.webkitPreservesPitch !== undefined) {
        audio.webkitPreservesPitch = shouldPreservePitch;
    }

  }, [tempo, pitch]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const t = audioRef.current.currentTime;
    setCurrentTime(t);
    if (!isScrubbing) {
        setScrubValue(t);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
        setDuration(audioRef.current.duration);
        if (isPlaying) audioRef.current.play().catch(() => {});
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setScrubValue(Number(e.target.value));
  };

  const handleSeekStart = () => setIsScrubbing(true);
  
  const handleSeekEnd = () => {
      if (audioRef.current) {
          audioRef.current.currentTime = scrubValue;
      }
      setIsScrubbing(false);
  };

  const skipForward = () => {
      if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + seekAmount);
  };

  const skipBackward = () => {
      if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - seekAmount);
  };

  // Scrolling Waveform Animation
  const tick = useCallback(() => {
    if (!canvasRef.current) {
        return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Config
    const barWidth = 4;
    const totalBarWidth = barWidth + 2; // gap = 2
    
    // Calculate scroll offset based on time
    const centerX = width / 2;
    const progress = duration > 0 ? currentTime / duration : 0;
    const totalWaveWidth = waveformData.length * totalBarWidth;
    const pixelsPlayed = progress * totalWaveWidth;
    const offsetX = centerX - pixelsPlayed;

    ctx.save();
    ctx.translate(offsetX, 0);

    waveformData.forEach((val, i) => {
        const x = i * totalBarWidth;
        if (x + offsetX < -50 || x + offsetX > width + 50) return;

        const barHeight = val * (height * 0.8);
        const y = (height - barHeight) / 2;
        const isPlayed = x < pixelsPlayed;

        ctx.fillStyle = isPlayed ? '#10b981' : 'rgba(255,255,255, 0.2)';
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, 2);
        } else {
            ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
    });

    ctx.restore();

    // Draw Center Line (Playhead)
    ctx.beginPath();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX, height - 10);
    ctx.stroke();

    // Gradient fade edges
    const gradientLeft = ctx.createLinearGradient(0, 0, 40, 0);
    gradientLeft.addColorStop(0, 'rgba(2,6,23, 1)'); // match bg-slate-950
    gradientLeft.addColorStop(1, 'rgba(2,6,23, 0)');
    ctx.fillStyle = gradientLeft;
    ctx.fillRect(0, 0, 40, height);

    const gradientRight = ctx.createLinearGradient(width - 40, 0, width, 0);
    gradientRight.addColorStop(0, 'rgba(2,6,23, 0)');
    gradientRight.addColorStop(1, 'rgba(2,6,23, 1)');
    ctx.fillStyle = gradientRight;
    ctx.fillRect(width - 40, 0, 40, height);

    animationRef.current = requestAnimationFrame(tick);
  }, [currentTime, duration, waveformData]);

  useEffect(() => {
    if (isExpanded) {
        animationRef.current = requestAnimationFrame(tick);
    }
    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isExpanded, tick]);

  if (!currentTrack) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-slate-950 text-white border-t border-slate-800 transition-all duration-500 z-50 ${isExpanded ? 'h-96' : 'h-24'}`}>
      
      {/* Expanded View Content (Waveform) */}
      <div className={`absolute inset-x-0 top-0 bottom-24 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <canvas 
            ref={canvasRef} 
            width={window.innerWidth} 
            height={280}
            className="w-full h-full block"
          />
          {/* Close Expand Button */}
          <button 
             onClick={() => setIsExpanded(false)}
             className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"
          >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
      </div>

      {/* Main Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 flex items-center justify-between px-6 z-10">
        
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
           <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 flex-shrink-0">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
           </div>
           <div className="min-w-0">
               <h3 className="font-bold text-sm truncate">{currentTrack.title}</h3>
               <p className="text-xs text-slate-400 truncate">{currentTrack.category}</p>
           </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center flex-1 max-w-xl">
           <div className="flex items-center gap-6 mb-2">
               <button onClick={skipBackward} className="text-slate-400 hover:text-white transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
               </button>
               <button 
                  onClick={onTogglePlay}
                  className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
               >
                   {isPlaying ? (
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                   ) : (
                       <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                   )}
               </button>
               <button onClick={skipForward} className="text-slate-400 hover:text-white transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" /></svg>
               </button>
           </div>
           
           <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
               <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
               <input 
                  type="range" 
                  min={0} 
                  max={duration || 100} 
                  value={isScrubbing ? scrubValue : currentTime}
                  onChange={handleSeekChange}
                  onMouseDown={handleSeekStart}
                  onMouseUp={handleSeekEnd}
                  onTouchStart={handleSeekStart}
                  onTouchEnd={handleSeekEnd}
                  className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
               />
               <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
           </div>
        </div>

        {/* Extra Actions */}
        <div className="w-1/4 flex justify-end items-center gap-4">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-2 rounded-lg transition-colors ${isExpanded ? 'text-donezo-green bg-donezo-green/10' : 'text-slate-400 hover:text-white'}`}
                title="Visualizer"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3 2zm0 0v-8" /></svg>
            </button>
            <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Close Player"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      </div>

      <audio 
         ref={audioRef}
         src={currentTrack.audio_url}
         onTimeUpdate={handleTimeUpdate}
         onLoadedMetadata={handleLoadedMetadata}
         onEnded={() => {}}
      />
    </div>
  );
};

export default AudioPlayer;