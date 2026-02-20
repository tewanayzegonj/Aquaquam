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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Player Settings / State
  const [seekAmount] = useState(10);

  // DSP State
  const [tempo, setTempo] = useState(100); 
  const [pitch, setPitch] = useState(0);   
  
  // A/B Loop State
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Interaction State
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  // Auto-open full screen when track changes
  useEffect(() => {
    if (currentTrack) {
      const timer = setTimeout(() => setIsFullScreen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [currentTrack?.id, currentTrack]);

  // Generate consistent waveform data
  const waveformData = useMemo(() => {
    if (!currentTrack) return [];
    const bars = [];
    const totalBars = 200; 
    for (let i = 0; i < totalBars; i++) {
        // Deterministic pseudo-random for visual
        const x = i / 8;
        const base = Math.sin(x) * 0.5 + 0.5;
        const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const val = Math.max(0.1, (base + Math.abs(noise)) * 0.7);
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
        (audio as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = shouldPreservePitch;
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
    
    // Handle A/B Loop
    if (isLooping && loopA !== null && loopB !== null) {
      if (t >= loopB) {
        audioRef.current.currentTime = loopA;
      }
    }

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

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !audioRef.current || duration === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const centerX = width / 2;
    
    // Config matches tick()
    const barWidth = 3;
    const gap = 1;
    const totalBarWidth = barWidth + gap;
    
    // Calculate which bar was clicked relative to the center playhead
    const totalWaveWidth = waveformData.length * totalBarWidth;
    const currentProgress = currentTime / duration;
    const pixelsPlayed = currentProgress * totalWaveWidth;
    
    // The click position x corresponds to: (centerX - pixelsPlayed) + (targetBarIndex * totalBarWidth)
    // So: targetBarIndex = (x - centerX + pixelsPlayed) / totalBarWidth
    const targetBarIndex = (x - centerX + pixelsPlayed) / totalBarWidth;
    const targetProgress = targetBarIndex / waveformData.length;
    const targetTime = Math.max(0, Math.min(duration, targetProgress * duration));
    
    audioRef.current.currentTime = targetTime;
  };

  // Scrolling Waveform Animation
  const tickRef = useRef<() => void>(() => {});

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
    const barWidth = 3;
    const gap = 1;
    const totalBarWidth = barWidth + gap;
    
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

        // Make it look like a symmetric waveform
        const barHeight = val * (height * 0.6);
        const y = (height - barHeight) / 2;
        const isPlayed = x < pixelsPlayed;

        ctx.fillStyle = isPlayed ? '#00A3FF' : 'rgba(0, 163, 255, 0.15)';
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, 1.5);
        } else {
            ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
    });

    ctx.restore();

    // Draw Center Line (Playhead) - Subtle
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
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

    animationRef.current = requestAnimationFrame(() => {
      if (isExpanded || isFullScreen) tickRef.current();
    });
  }, [currentTime, duration, waveformData, isExpanded, isFullScreen]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (isExpanded || isFullScreen) {
        animationRef.current = requestAnimationFrame(tick);
    }
    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isExpanded, isFullScreen, tick]);

  if (!currentTrack) return null;

  return (
    <>
      {/* Full Screen Player */}
      <div className={`fixed inset-0 bg-black z-[100] transition-all duration-700 ease-in-out flex flex-col items-center ${isFullScreen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        
        {/* Centered Container for Desktop */}
        <div className="w-full max-w-lg h-full flex flex-col bg-black shadow-2xl relative">
          
          {/* Drag Handle */}
          <div className="w-full flex justify-center pt-4">
            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-white text-xl font-medium tracking-tight truncate max-w-[200px]">{currentTrack.title}</h2>
            </div>
            <div className="flex items-center gap-6 text-white/80">
              <button className="hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
              <button 
                onClick={() => setIsFullScreen(false)}
                className="hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col px-8 gap-8 overflow-y-auto scrollbar-hide">
            {/* Tempo & Pitch Controls */}
            <div className="space-y-8">
              {/* Tempo */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white text-lg font-medium">Tempo</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#00A3FF] text-lg font-medium">{tempo}%</span>
                    <button onClick={() => setTempo(100)} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                  </div>
                </div>
                <div className="relative h-8 flex items-center">
                  <div className="absolute w-full h-1 bg-white/10 rounded-full"></div>
                  <div className="absolute h-1 bg-[#00A3FF] rounded-full" style={{ width: `${((tempo - 50) / 150) * 100}%` }}></div>
                  <input 
                    type="range" 
                    min={50} 
                    max={200} 
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute w-8 h-4 bg-white rounded-full shadow-lg pointer-events-none"
                    style={{ left: `calc(${((tempo - 50) / 150) * 100}% - 16px)` }}
                  ></div>
                </div>
              </div>

              {/* Pitch */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white text-lg font-medium">Pitch</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#00A3FF] text-lg font-medium">{pitch > 0 ? `+${pitch.toFixed(2)}` : pitch.toFixed(2)}</span>
                    <button onClick={() => setPitch(0)} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                  </div>
                </div>
                <div className="relative h-8 flex items-center">
                  <div className="absolute w-full h-1 bg-white/10 rounded-full"></div>
                  <div className="absolute h-1 bg-[#00A3FF] rounded-full" style={{ width: `${((pitch + 12) / 24) * 100}%` }}></div>
                  <input 
                    type="range" 
                    min={-12} 
                    max={12} 
                    step={0.01}
                    value={pitch}
                    onChange={(e) => setPitch(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute w-8 h-4 bg-white rounded-full shadow-lg pointer-events-none"
                    style={{ left: `calc(${((pitch + 12) / 24) * 100}% - 16px)` }}
                  ></div>
                </div>
              </div>

              {/* Loop Controls */}
              <div className="flex items-center justify-between">
                <span className="text-white text-lg font-medium">Loop</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      if (loopA === null) setLoopA(currentTime);
                      else setLoopA(null);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${loopA !== null ? 'bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/40' : 'bg-white/5 text-white/40 hover:text-white'}`}
                  >
                    A
                  </button>
                  <button 
                    onClick={() => {
                      if (loopB === null) {
                        if (loopA !== null && currentTime > loopA) {
                          setLoopB(currentTime);
                          setIsLooping(true);
                        }
                      } else {
                        setLoopB(null);
                        setIsLooping(false);
                      }
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${loopB !== null ? 'bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/40' : 'bg-white/5 text-white/40 hover:text-white'}`}
                  >
                    B
                  </button>
                  <button 
                    onClick={() => {
                      setLoopA(null);
                      setLoopB(null);
                      setIsLooping(false);
                    }}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Waveform Visualizer */}
            <div 
              className="relative w-full h-64 bg-black rounded-3xl overflow-hidden shadow-inner border border-white/5 cursor-pointer group"
              onClick={handleWaveformClick}
            >
              <canvas 
                ref={canvasRef} 
                width={500} 
                height={256}
                className="w-full h-full block transition-opacity duration-300 group-hover:opacity-80"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-px h-full bg-white/10"></div>
              </div>
              <button className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-[#00A3FF] hover:bg-white/10 transition-colors pointer-events-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
              {/* Tooltip on hover */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
                Click waveform to seek
              </div>
            </div>

            {/* Seeker & Playback Controls */}
            <div className="space-y-8 pb-12">
              {/* Seek Slider */}
              <div className="space-y-4">
                <div className="relative h-8 flex items-center">
                  <div className="absolute w-full h-2 bg-white/10 rounded-full"></div>
                  <div className="absolute h-2 bg-white/40 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                  <input 
                    type="range" 
                    min={0} 
                    max={duration || 100} 
                    value={isScrubbing ? scrubValue : currentTime}
                    onChange={handleSeekChange}
                    onMouseDown={handleSeekStart}
                    onMouseUp={handleSeekEnd}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute w-12 h-6 bg-white rounded-full shadow-lg pointer-events-none"
                    style={{ left: `calc(${(currentTime / duration) * 100}% - 24px)` }}
                  ></div>
                </div>
                <div className="flex justify-between text-lg font-medium text-white">
                  <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Playback Controls Row */}
              <div className="flex items-center justify-between px-4">
                <button className="w-14 h-14 rounded-full bg-[#00A3FF]/10 flex items-center justify-center text-[#00A3FF] hover:bg-[#00A3FF]/20 transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4" /></svg>
                </button>
                
                <div className="flex items-center gap-8">
                  <button className="text-[#00A3FF] hover:scale-110 transition-transform">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                  </button>
                  <button onClick={skipBackward} className="text-[#00A3FF] hover:scale-110 transition-transform">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
                  </button>
                  <button 
                    onClick={onTogglePlay}
                    className="text-[#00A3FF] hover:scale-110 transition-transform"
                  >
                    {isPlaying ? (
                      <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                  <button onClick={skipForward} className="text-[#00A3FF] hover:scale-110 transition-transform">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M13 6v12l8.5-6L13 6zM4 6v12l8.5-6L4 6z"/></svg>
                  </button>
                  <button className="text-[#00A3FF] hover:scale-110 transition-transform">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </button>
                </div>

                <button className="w-14 h-14 rounded-full bg-[#00A3FF]/10 flex items-center justify-center text-[#00A3FF] hover:bg-[#00A3FF]/20 transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                </button>
              </div>

              {/* Footer: Playing Next */}
              <div className="flex items-center justify-center gap-3 text-[#00A3FF] font-medium">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                <span>Playing Next: {currentTrack.title}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Player */}
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
          <div 
            className="flex items-center gap-3 lg:gap-4 lg:w-1/4 min-w-0 lg:min-w-[200px] cursor-pointer group"
            onClick={() => setIsFullScreen(true)}
          >
             <div className="w-10 h-10 lg:w-14 lg:h-14 bg-slate-800 rounded-lg lg:rounded-xl flex items-center justify-center text-slate-500 flex-shrink-0 group-hover:bg-donezo-green group-hover:text-white transition-all">
                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
             </div>
             <div className="min-w-0">
                 <h3 className="font-bold text-xs lg:text-sm truncate group-hover:text-donezo-green transition-colors">{currentTrack.title}</h3>
                 <p className="text-[10px] lg:text-xs text-slate-400 truncate">{currentTrack.category}</p>
             </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center flex-1 max-w-xl px-2">
             <div className="flex items-center gap-4 lg:gap-6 mb-2">
                 <button onClick={skipBackward} className="hidden lg:block text-slate-400 hover:text-white transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
                 </button>
                 <button 
                    onClick={onTogglePlay}
                    className="w-10 h-10 lg:w-12 lg:h-12 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
                 >
                     {isPlaying ? (
                         <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                     ) : (
                         <svg className="w-5 h-5 lg:w-6 lg:h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     )}
                 </button>
                 <button onClick={skipForward} className="hidden lg:block text-slate-400 hover:text-white transition-colors">
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
          <div className="flex justify-end items-center gap-2 lg:gap-4 lg:w-1/4">
              <button 
                  onClick={() => setIsFullScreen(true)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Full Screen"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </button>
              <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`hidden lg:flex p-2 rounded-lg transition-colors ${isExpanded ? 'text-donezo-green bg-donezo-green/10' : 'text-slate-400 hover:text-white'}`}
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
      </div>

      <audio 
         ref={audioRef}
         src={currentTrack.audio_url}
         onTimeUpdate={handleTimeUpdate}
         onLoadedMetadata={handleLoadedMetadata}
         onEnded={() => {}}
      />
    </>
  );
};

export default AudioPlayer;