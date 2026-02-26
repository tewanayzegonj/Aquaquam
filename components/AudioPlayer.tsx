import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as Tone from 'tone';
import useOnClickOutside from '../hooks/useOnClickOutside';

interface AudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  isSidebarCollapsed: boolean;
}

interface ExtendedAudioElement extends HTMLAudioElement {
  mozPreservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
  preservesPitch?: boolean;
}

const ScrollPicker: React.FC<{
  options: (string | number)[];
  value: string | number;
  onChange: (val: string | number) => void;
  label?: string;
}> = ({ options, value, onChange, label }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 40;

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (options[index] !== undefined && options[index] !== value) {
      onChange(options[index]);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const index = options.indexOf(value);
    if (index !== -1) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [value, options]);

  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-2">{label}</span>}
      <div className="relative h-[120px] w-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="h-[40px] bg-gradient-to-b from-black to-transparent opacity-80" />
          <div className="h-[40px] mt-[40px] border-y border-white/20" />
          <div className="h-[40px] bg-gradient-to-t from-black to-transparent opacity-80" />
        </div>
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory py-[40px]"
        >
          {options.map((opt, i) => (
            <div 
              key={i} 
              className={`h-[40px] flex items-center justify-center snap-center transition-all duration-200 ${opt === value ? 'text-white text-lg font-bold' : 'text-white/20 text-sm'}`}
            >
              {typeof opt === 'number' ? opt.toString().padStart(2, '0') : opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ currentTrack, isPlaying, onTogglePlay, onClose, isSidebarCollapsed }) => {
  const audioRef = useRef<ExtendedAudioElement>(null);
  const fullScreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Refs for animation state to avoid re-creating tick function
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const isFullScreenRef = useRef(false);
  const isExpandedRef = useRef(false);
  const waveformDataRef = useRef<number[]>([]);
  const isScrubbingRef = useRef(false);
  const scrubValueRef = useRef(0);
  const isPlayingRef = useRef(false);
  const loopARef = useRef<number | null>(null);
  const loopBRef = useRef<number | null>(null);
  const isLoopingRef = useRef(false);

  // DOM Refs for smooth updates
  const fsProgressRef = useRef<HTMLDivElement>(null);
  const fsHandleRef = useRef<HTMLDivElement>(null);
  const fsTimeLabelRef = useRef<HTMLSpanElement>(null);
  const miniRangeRef = useRef<HTMLInputElement>(null);
  const miniTimeLabelRef = useRef<HTMLSpanElement>(null);
  const windowWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Tone.js Refs
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const isToneStarted = useRef(false);

  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [seekAmount, setSeekAmount] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [tempo, setTempo] = useState(100); 
  const [pitch, setPitch] = useState(0);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [isEditingLoop, setIsEditingLoop] = useState(false);
  const [waveformZoom, setWaveformZoom] = useState(1);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const bookmarksRef = useRef<HTMLDivElement>(null);
  const waveformZoomRef = useRef(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [bookmarks, setBookmarks] = useState<{ id: string; time: number; label: string }[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editBookmarkLabel, setEditBookmarkLabel] = useState("");

  useOnClickOutside(zoomMenuRef, () => setShowZoomMenu(false));
  useOnClickOutside(settingsRef, () => setShowSettings(false));
  useOnClickOutside(bookmarksRef, () => setShowBookmarks(false));

  // Update zoom ref
  useEffect(() => {
    waveformZoomRef.current = waveformZoom;
  }, [waveformZoom]);

  // Load bookmarks from localStorage
  useEffect(() => {
    if (currentTrack) {
      const saved = localStorage.getItem(`bookmarks_${currentTrack.id}`);
      if (saved) setBookmarks(JSON.parse(saved));
      else setBookmarks([]);
    }
  }, [currentTrack]);

  // Save bookmarks to localStorage
  useEffect(() => {
    if (currentTrack && bookmarks.length > 0) {
      localStorage.setItem(`bookmarks_${currentTrack.id}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, currentTrack]);

  // Sleep Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sleepTimer !== null && sleepTimer > 0 && isPlaying) {
      interval = setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            if (isPlayingRef.current) {
               onTogglePlay();
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying, onTogglePlay]);

  const formatSleepTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addBookmark = () => {
    const newBookmark = {
      id: `bm_${Date.now()}`,
      time: currentTime,
      label: `Bookmark at ${formatTime(currentTime)}`
    };
    setBookmarks(prev => [...prev, newBookmark]);
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const updateBookmarkLabel = (id: string, newLabel: string) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, label: newLabel } : b));
    setEditingBookmarkId(null);
  };

  // Generate consistent waveform data
  const waveformData = useMemo(() => {
    if (!currentTrack) return [];
    const bars = [];
    const totalBars = 400; // Optimized density
    for (let i = 0; i < totalBars; i++) {
        // Multi-layered sine waves for a more organic "audio" look
        const x = i / 8;
        const y = Math.sin(x) * 0.3 + Math.sin(x * 2.3) * 0.2 + Math.sin(x * 4.7) * 0.1 + Math.random() * 0.1;
        const val = Math.max(0.1, Math.abs(y) + 0.1);
        bars.push(val);
    }
    return bars;
  }, [currentTrack]);

  // Sync refs with state
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { isFullScreenRef.current = isFullScreen; }, [isFullScreen]);
  useEffect(() => { isExpandedRef.current = isExpanded; }, [isExpanded]);
  useEffect(() => { waveformDataRef.current = waveformData; }, [waveformData]);
  useEffect(() => { isScrubbingRef.current = isScrubbing; }, [isScrubbing]);
  useEffect(() => { scrubValueRef.current = scrubValue; }, [scrubValue]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { loopARef.current = loopA; }, [loopA]);
  useEffect(() => { loopBRef.current = loopB; }, [loopB]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      windowWidthRef.current = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-open full screen when track changes
  useEffect(() => {
    if (currentTrack) {
      const timer = setTimeout(() => setIsFullScreen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [currentTrack?.id, currentTrack]);

  const handleTogglePlay = async () => {
    // Ensure context is running on user interaction
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }
    onTogglePlay();
  };

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
        // Ensure Tone.js context is running
        if (Tone.context.state !== 'running') {
            Tone.context.resume();
        }
        audioRef.current.play().catch(e => console.log("Playback error:", e));
    } else {
        audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  
  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  // Handle DSP (Tempo)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Tempo (Playback Rate) - Preserves Pitch by default in browsers
    audio.playbackRate = tempo / 100;
    
    // Ensure pitch preservation is on so tempo doesn't affect pitch
    if ('preservesPitch' in audio) {
      audio.preservesPitch = true;
    } else if ('mozPreservesPitch' in audio) {
       audio.mozPreservesPitch = true;
    } else if ('webkitPreservesPitch' in audio) {
       audio.webkitPreservesPitch = true;
    }
  }, [tempo]);

  // Initialize Tone.js
  const initTone = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || isToneStarted.current) return;
    
    // Lazy init: only start Tone if pitch is actually being shifted
    if (pitch === 0) return;

    try {
        isToneStarted.current = true;
        
        // Ensure context is started/resumed
        await Tone.start();
        
        // Create source node
        if (!sourceRef.current) {
            sourceRef.current = Tone.context.createMediaElementSource(audio);
        }

        // Disable browser's native pitch preservation so Tone.js can handle it
        if ('preservesPitch' in audio) {
            audio.preservesPitch = false;
        } else if ('webkitPreservesPitch' in audio) {
            audio.webkitPreservesPitch = false;
        }

        const pitchShift = new Tone.PitchShift({
          pitch: pitch,
          windowSize: 0.1,
          delayTime: 0.03,
        }).toDestination();
        
        // Connect source to pitch shift
        sourceRef.current.connect(pitchShift);
        
        pitchShiftRef.current = pitchShift;
    } catch (e) {
        console.error("Tone.js init error:", e);
        isToneStarted.current = false;
        if (sourceRef.current) {
            try { sourceRef.current.connect(Tone.context.destination); } catch (e) { console.error("Fallback connection failed", e); }
        }
    }
  }, [pitch]);

  // Update Pitch & Lazy Init
  useEffect(() => {
    if (pitch !== 0 && !pitchShiftRef.current) {
      initTone();
    }
    
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = pitch;
      // Bypass effect if pitch is 0 for natural sound
      pitchShiftRef.current.wet.value = pitch === 0 ? 0 : 1;
      
      // Ensure context is running if pitch is changed
      if (Tone.context.state !== 'running') {
          Tone.context.resume();
      }
    }
  }, [pitch, initTone]);

  // Cleanup Tone.js on unmount
  useEffect(() => {
    return () => {
      if (pitchShiftRef.current) {
        pitchShiftRef.current.dispose();
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      isToneStarted.current = false;
    };
  }, []);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const t = audioRef.current.currentTime;
    setCurrentTime(t);
    
    // Handle A/B Loop using refs for latest values
    if (isLoopingRef.current && loopARef.current !== null && loopBRef.current !== null) {
      if (t >= loopBRef.current) {
        audioRef.current.currentTime = loopARef.current;
      }
    }

    if (!isScrubbing) {
        setScrubValue(t);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
        setDuration(audioRef.current.duration);
        
        // Initialize Tone.js when metadata is ready
        initTone();

        if (isPlayingRef.current) {
            audioRef.current.play().catch(e => console.log("Playback error:", e));
        }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setScrubValue(val);
      scrubValueRef.current = val;
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

  // Waveform Interaction
  const [isWaveformDragging, setIsWaveformDragging] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartTimeRef = useRef<number>(0);

  const handleWaveformInteraction = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, isInitial = false) => {
    const canvas = isFullScreenRef.current ? fullScreenCanvasRef.current : miniCanvasRef.current;
    if (!canvas || !audioRef.current || durationRef.current === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX;
    
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
    } else {
        clientX = (e as React.MouseEvent).clientX;
    }

    const x = clientX - rect.left;
    
    // Config matches tick()
    const barWidth = 2;
    const gap = 1;
    const totalBarWidth = barWidth + gap;
    const totalWaveWidth = waveformDataRef.current.length * totalBarWidth;
    const pixelsPerSecond = totalWaveWidth / durationRef.current;

    if (isInitial) {
        dragStartXRef.current = x;
        dragStartTimeRef.current = currentTimeRef.current;
        setIsScrubbing(true);
        scrubValueRef.current = currentTimeRef.current;
        setScrubValue(currentTimeRef.current);
    } else if (dragStartXRef.current !== null) {
        const dx = x - dragStartXRef.current;
        // Natural scrolling: dragging left (dx < 0) moves waveform left, which means seeking forward
        const timeDelta = dx / pixelsPerSecond;
        const targetTime = Math.max(0, Math.min(durationRef.current, dragStartTimeRef.current - timeDelta));
        
        scrubValueRef.current = targetTime;
        setScrubValue(targetTime);
    }
  }, []);

  const handleWaveformMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      setIsWaveformDragging(true);
      handleWaveformInteraction(e, true);
  }, [handleWaveformInteraction]);

  const handleWaveformMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (isWaveformDragging) {
          handleWaveformInteraction(e);
      }
  }, [isWaveformDragging, handleWaveformInteraction]);

  const handleWaveformMouseUp = useCallback(() => {
      if (isWaveformDragging && audioRef.current) {
          audioRef.current.currentTime = scrubValueRef.current;
      }
      setIsWaveformDragging(false);
      setIsScrubbing(false);
      dragStartXRef.current = null;
  }, [isWaveformDragging]);

  const handleWaveformTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      setIsWaveformDragging(true);
      handleWaveformInteraction(e, true);
  }, [handleWaveformInteraction]);

  const handleWaveformTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      if (isWaveformDragging) {
          handleWaveformInteraction(e);
      }
  }, [isWaveformDragging, handleWaveformInteraction]);

  const handleWaveformTouchEnd = useCallback(() => {
      handleWaveformMouseUp();
  }, [handleWaveformMouseUp]);

  // Add global mouse up listener to stop dragging if mouse leaves the element
  useEffect(() => {
      if (isWaveformDragging) {
          window.addEventListener('mouseup', handleWaveformMouseUp);
          window.addEventListener('touchend', handleWaveformTouchEnd);
      }
      return () => {
          window.removeEventListener('mouseup', handleWaveformMouseUp);
          window.removeEventListener('touchend', handleWaveformTouchEnd);
      };
  }, [isWaveformDragging, handleWaveformMouseUp, handleWaveformTouchEnd]);

  // Scrolling Waveform Animation
  const tick = useCallback(function animate() {
    try {
        const isFS = isFullScreenRef.current;
        const isExp = isExpandedRef.current;
        
        // Stop animation if neither view is active
        if (!isFS && !isExp) {
            animationRef.current = null;
            return;
        }

        const canvas = isFS ? fullScreenCanvasRef.current : miniCanvasRef.current;
        
        if (!canvas) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        // Sync internal resolution with display size (High DPI)
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        // Check if canvas size needs update
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            // Scale context to match
            ctx.scale(dpr, dpr);
        }
        
        // Use logical dimensions for drawing calculations
        const width = rect.width;
        const height = rect.height;

        if (width === 0 || height === 0) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }
        
        // Update current time from audio element for 60fps smoothness
        if (audioRef.current && !isScrubbingRef.current) {
            currentTimeRef.current = audioRef.current.currentTime;
        }
        
        const curTime = isScrubbingRef.current ? scrubValueRef.current : currentTimeRef.current;
        const dur = durationRef.current;
        const waveData = waveformDataRef.current;
        const lA = loopARef.current;
        const lB = loopBRef.current;
        const isL = isLoopingRef.current;
        
        // Smoothly update progress bars via DOM refs
        const progressPercent = dur > 0 ? (curTime / dur) * 100 : 0;
        const timeStr = `${Math.floor(curTime / 60)}:${Math.floor(curTime % 60).toString().padStart(2, '0')}`;

        if (fsProgressRef.current) fsProgressRef.current.style.width = `${progressPercent}%`;
        if (fsHandleRef.current) fsHandleRef.current.style.left = `calc(${progressPercent}% - ${windowWidthRef.current < 768 ? 12 : 16}px)`;
        if (fsTimeLabelRef.current) fsTimeLabelRef.current.textContent = timeStr;
        if (miniRangeRef.current) miniRangeRef.current.value = curTime.toString();
        if (miniTimeLabelRef.current) miniTimeLabelRef.current.textContent = timeStr;

        // Clear
        ctx.clearRect(0, 0, width, height);
        
        // Config
        const zoomFactor = Math.pow(1.5, waveformZoomRef.current - 1); // Exponential zoom for significant width increase
        const barWidth = 1.5 * zoomFactor;
        const gap = 1 * zoomFactor;
        const totalBarWidth = barWidth + gap;
        
        // Calculate scroll offset based on time
        const centerX = width / 2;
        const progress = dur > 0 ? curTime / dur : 0;
        const totalWaveWidth = waveData.length * totalBarWidth;
        const pixelsPlayed = progress * totalWaveWidth;
        const offsetX = centerX - pixelsPlayed;

        // Calculate loop positions in pixels
        const loopAX = lA !== null ? centerX + (lA - curTime) * (totalWaveWidth / dur) : null;
        const loopBX = lB !== null ? centerX + (lB - curTime) * (totalWaveWidth / dur) : null;

        // Create Gradient for Played State (Emerald to Teal)
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#10b981'); // Emerald 500
        gradient.addColorStop(1, '#2dd4bf'); // Teal 400

        ctx.save();
        ctx.translate(offsetX, 0);

        // Optimized Batch Drawing
        // 1. Draw Background Bars (Unplayed, inside loop or no loop)
        ctx.beginPath();
        waveData.forEach((val, i) => {
            const x = i * totalBarWidth;
            if (x + offsetX < -50 || x + offsetX > width + 50) return;
            if (x < pixelsPlayed) return;

            const timeAtX = (x / totalWaveWidth) * dur;
            if (isL && lA !== null && lB !== null && (timeAtX < lA || timeAtX > lB)) return;

            const barHeight = Math.max(2, val * (height * 0.85));
            const y = (height - barHeight) / 2;
            ctx.rect(x, y, barWidth, barHeight);
        });
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();

        // 2. Draw Played Bars with Glow (Inside loop or no loop)
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.beginPath();
        waveData.forEach((val, i) => {
            const x = i * totalBarWidth;
            if (x + offsetX < -50 || x + offsetX > width + 50) return;
            if (x >= pixelsPlayed) return;

            const timeAtX = (x / totalWaveWidth) * dur;
            if (isL && lA !== null && lB !== null && (timeAtX < lA || timeAtX > lB)) return;

            const barHeight = Math.max(2, val * (height * 0.85));
            const y = (height - barHeight) / 2;
            ctx.rect(x, y, barWidth, barHeight);
        });
        ctx.fillStyle = gradient;
        ctx.fill();

        // 3. Draw Grayed Out Bars (Outside loop, completely grayed out regardless of played state)
        if (isL && lA !== null && lB !== null) {
            ctx.shadowBlur = 0; // Remove glow for grayed out areas
            ctx.beginPath();
            waveData.forEach((val, i) => {
                const x = i * totalBarWidth;
                if (x + offsetX < -50 || x + offsetX > width + 50) return;

                const timeAtX = (x / totalWaveWidth) * dur;
                if (!(timeAtX < lA || timeAtX > lB)) return; // Only draw if OUTSIDE loop

                const barHeight = Math.max(2, val * (height * 0.85));
                const y = (height - barHeight) / 2;
                ctx.rect(x, y, barWidth, barHeight);
            });
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fill();
        }

        ctx.restore();

        // Draw Loop Markers
        if (lA !== null && loopAX !== null) {
            ctx.beginPath();
            ctx.strokeStyle = '#00A3FF';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.moveTo(loopAX, 0);
            ctx.lineTo(loopAX, height);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw 'A' label
            ctx.fillStyle = '#00A3FF';
            ctx.font = 'bold 12px Inter';
            ctx.fillText('A', loopAX + 5, 20);
        }

        if (lB !== null && loopBX !== null) {
            ctx.beginPath();
            ctx.strokeStyle = '#00A3FF';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.moveTo(loopBX, 0);
            ctx.lineTo(loopBX, height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw 'B' label
            ctx.fillStyle = '#00A3FF';
            ctx.font = 'bold 12px Inter';
            ctx.fillText('B', loopBX + 5, 20);
        }

        // Draw Center Line (Playhead) - Subtle
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();

        // Gradient fade edges
        const fadeColor = isFS ? 'rgba(0,0,0,' : 'rgba(2,6,23,';
        
        ctx.fillStyle = ctx.createLinearGradient(0, 0, 60, 0);
        (ctx.fillStyle as CanvasGradient).addColorStop(0, `${fadeColor} 1)`);
        (ctx.fillStyle as CanvasGradient).addColorStop(1, `${fadeColor} 0)`);
        ctx.fillRect(0, 0, 60, height);

        ctx.fillStyle = ctx.createLinearGradient(width - 60, 0, width, 0);
        (ctx.fillStyle as CanvasGradient).addColorStop(0, `${fadeColor} 0)`);
        (ctx.fillStyle as CanvasGradient).addColorStop(1, `${fadeColor} 1)`);
        ctx.fillRect(width - 60, 0, 60, height);

        animationRef.current = requestAnimationFrame(animate);
    } catch (e) {
        console.error("Animation error:", e);
        animationRef.current = requestAnimationFrame(animate);
    }
  }, []);

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
      <div className={`fixed inset-0 bg-black z-[100] transition-all duration-700 ease-in-out flex flex-col items-center antialiased overflow-hidden ${isFullScreen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        
        {/* Centered Container for Desktop */}
        <div className="w-full max-w-lg h-full flex flex-col bg-black shadow-2xl relative overflow-hidden">
          
          {/* Drag Handle */}
          <div className="w-full flex justify-center pt-2 md:pt-4 flex-shrink-0">
            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-white text-lg md:text-xl font-medium tracking-tight truncate max-w-[200px]">{currentTrack.title}</h2>
            </div>
            <div className="flex items-center gap-4 md:gap-6 text-white/80">
              <button 
                onClick={addBookmark}
                className="hover:text-white transition-colors"
                title="Add Bookmark"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button 
                onClick={() => setShowBookmarks(!showBookmarks)}
                className={`hover:text-white transition-colors ${showBookmarks ? 'text-donezo-green' : ''}`}
                title="Bookmarks"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
              <button 
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowSleepTimer(false);
                  setShowBookmarks(false);
                }}
                className={`hover:text-white transition-colors ${showSettings ? 'text-donezo-green' : ''}`}
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                onClick={() => {
                  setIsFullScreen(false);
                  setShowSettings(false);
                  setShowSleepTimer(false);
                  setShowBookmarks(false);
                }}
                className="hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col px-4 md:px-8 gap-2 md:gap-4 overflow-y-auto scrollbar-hide w-full relative pb-2 md:pb-4">
            
            {/* Metadata Info / Sleep Timer Countdown */}
            <div className="space-y-1 text-center md:text-left flex-shrink-0 pt-2 min-h-[60px] flex flex-col justify-center">
              {sleepTimer !== null && sleepTimer > 0 ? (
                <div className="flex items-center justify-center animate-pulse w-full relative">
                  <div className="flex-1"></div>
                  <div className="bg-donezo-green/10 border border-donezo-green/30 px-4 py-1 rounded-xl text-donezo-green text-2xl md:text-3xl font-black tracking-tighter font-mono shadow-lg shadow-donezo-green/5">
                    {formatSleepTimer(sleepTimer)}
                  </div>
                  <div className="flex-1 flex justify-start pl-3">
                    <button 
                      onClick={() => setSleepTimer(null)}
                      className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 rounded-full transition-colors"
                      title="Cancel Timer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    <h2 className="text-white text-lg md:text-xl font-bold tracking-tight truncate">{currentTrack.title}</h2>
                    {currentTrack.composer && (
                      <span className="text-white/40 text-xs md:text-sm font-medium">by {currentTrack.composer}</span>
                    )}
                  </div>
                  {currentTrack.scriptureReference && (
                    <p className="text-white/60 text-[10px] md:text-xs font-medium uppercase tracking-widest">{currentTrack.scriptureReference}</p>
                  )}
                </>
              )}
            </div>

            {/* Settings Overlay */}
            {showSettings && (
              <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl p-6 md:p-10 animate-fade-in flex flex-col gap-6 md:gap-8" ref={settingsRef}>
                <div className="flex justify-between items-center">
                  <h3 className="text-white text-2xl font-black tracking-tight">Player Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="space-y-6 md:space-y-8">
                  {/* Seek Amount */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Seek Interval</span>
                      <span className="text-donezo-green text-xl font-black">{seekAmount}s</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[3, 5, 10, 15, 30].map(amount => (
                        <button 
                          key={amount}
                          onClick={() => setSeekAmount(amount)}
                          className={`py-3 rounded-2xl text-sm font-bold transition-all ${seekAmount === amount ? 'bg-donezo-green text-white shadow-lg shadow-donezo-green/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                          {amount}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Playback Speed (Tempo) */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Playback Speed</span>
                      <span className="text-[#00A3FF] text-xl font-black">{tempo / 100}x</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button 
                          key={speed}
                          onClick={() => setTempo(speed * 100)}
                          className={`py-3 rounded-2xl text-xs font-bold transition-all ${tempo === speed * 100 ? 'bg-[#00A3FF] text-white shadow-lg shadow-[#00A3FF]/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep Timer Trigger */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Sleep Timer</span>
                      <span className="text-donezo-green text-xl font-black">{sleepTimer !== null ? formatSleepTimer(sleepTimer) : 'Off'}</span>
                    </div>
                    <button 
                      onClick={() => setShowSleepTimer(true)}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Set Sleep Timer
                    </button>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                   <button 
                    onClick={() => {
                      setTempo(100);
                      setSeekAmount(10);
                      setPitch(0);
                    }}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                   >
                     Reset to Defaults
                   </button>
                </div>
              </div>
            )}

            {/* Bookmarks Overlay */}
            {showBookmarks && (
              <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl p-6 md:p-10 animate-fade-in flex flex-col gap-6" ref={bookmarksRef}>
                <div className="flex justify-between items-center">
                  <h3 className="text-white text-2xl font-black tracking-tight">Bookmarks</h3>
                  <button onClick={() => setShowBookmarks(false)} className="text-white/40 hover:text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                  {bookmarks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <p className="font-bold">No bookmarks yet</p>
                    </div>
                  ) : (
                    bookmarks.map(bm => (
                      <div key={bm.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between group">
                        {editingBookmarkId === bm.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input 
                              type="text"
                              value={editBookmarkLabel}
                              onChange={(e) => setEditBookmarkLabel(e.target.value)}
                              onBlur={() => updateBookmarkLabel(bm.id, editBookmarkLabel)}
                              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-donezo-green"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateBookmarkLabel(bm.id, editBookmarkLabel);
                                if (e.key === 'Escape') setEditingBookmarkId(null);
                              }}
                            />
                            <button 
                              onClick={() => updateBookmarkLabel(bm.id, editBookmarkLabel)}
                              className="p-2 text-donezo-green hover:bg-donezo-green/10 rounded-xl transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                if (audioRef.current) audioRef.current.currentTime = bm.time;
                                setShowBookmarks(false);
                              }}
                              className="flex-1 text-left"
                            >
                              <p className="text-white font-bold">{bm.label}</p>
                              <p className="text-white/40 text-xs font-mono">{formatTime(bm.time)}</p>
                            </button>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setEditingBookmarkId(bm.id);
                                  setEditBookmarkLabel(bm.label);
                                }}
                                className="p-2 text-white/20 hover:text-[#00A3FF] transition-colors"
                                title="Rename"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button 
                                onClick={() => removeBookmark(bm.id)}
                                className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Sleep Timer Overlay (Drum Picker + Horizontal Presets) */}
            {showSleepTimer && (
              <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-xl p-6 md:p-10 animate-fade-in flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-8">
                  <button onClick={() => setShowSleepTimer(false)} className="text-white/40 hover:text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </button>
                  <h3 className="text-white text-2xl font-black tracking-tight">Sleep timer</h3>
                  <div className="w-8" />
                </div>

                <div className="flex-1 w-full flex flex-col justify-center gap-8">
                  {/* Horizontal Presets */}
                  <div className="w-full overflow-x-auto scrollbar-hide flex gap-3 pb-4">
                    {[5, 10, 15, 30, 45, 60, 90, 120].map(mins => (
                      <button
                        key={mins}
                        onClick={() => {
                          setSleepTimer(mins * 60);
                        }}
                        className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all ${sleepTimer === mins * 60 ? 'bg-donezo-green text-white shadow-lg shadow-donezo-green/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                      >
                        {mins}m
                      </button>
                    ))}
                    <button
                      onClick={() => setSleepTimer(null)}
                      className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all ${sleepTimer === null ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-red-500/40 hover:bg-red-500/10'}`}
                    >
                      Off
                    </button>
                  </div>

                  <div className="flex justify-center gap-12">
                    <div className="flex flex-col gap-4">
                      <h4 className="text-white/60 text-sm font-bold uppercase tracking-widest text-center">Hours</h4>
                      <ScrollPicker 
                        options={Array.from({ length: 25 }, (_, i) => i)}
                        value={sleepTimer ? Math.floor(sleepTimer / 3600) : 0}
                        onChange={(val) => {
                          const currentMins = sleepTimer ? Math.floor((sleepTimer % 3600) / 60) : 0;
                          setSleepTimer(Number(val) * 3600 + currentMins * 60);
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <h4 className="text-white/60 text-sm font-bold uppercase tracking-widest text-center">Minutes</h4>
                      <ScrollPicker 
                        options={Array.from({ length: 60 }, (_, i) => i)}
                        value={sleepTimer ? Math.floor((sleepTimer % 3600) / 60) : 0}
                        onChange={(val) => {
                          const currentHours = sleepTimer ? Math.floor(sleepTimer / 3600) : 0;
                          setSleepTimer(currentHours * 3600 + Number(val) * 60);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSleepTimer(false)}
                  className="mt-auto w-16 h-16 bg-[#00A3FF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00A3FF]/40 mb-8"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Loop Editor Overlay (Drum Picker) */}
            {isEditingLoop && (
              <div className="absolute inset-0 z-[60] bg-[#121418] p-6 animate-fade-in flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4">
                  <button onClick={() => setIsEditingLoop(false)} className="text-white/40 hover:text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <h3 className="text-white text-xl font-bold">Edit loop points</h3>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setLoopA(null);
                        setLoopB(null);
                        setIsLooping(false);
                      }}
                      className="text-white/40 hover:text-white"
                      title="Clear Loop"
                    >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <div className="w-full text-center mb-4">
                  <span className="text-white/60 font-mono text-sm">{formatTime(currentTime)}</span>
                </div>

                {/* Mini Waveform in Loop Editor */}
                <div className="w-full h-16 bg-white/5 rounded-xl overflow-hidden mb-8 relative">
                   <div className="absolute inset-0 flex items-center justify-between px-1">
                      {waveformData.filter((_, i) => i % 4 === 0).map((val, i) => (
                        <div key={i} className="w-[2px] bg-white/20" style={{ height: `${val * 100}%` }} />
                      ))}
                   </div>
                   {loopA !== null && (
                     <div 
                       className="absolute top-0 bottom-0 bg-[#00A3FF]/30 border-x-2 border-[#00A3FF] transition-all duration-200"
                       style={{
                         left: `${(loopA / duration) * 100}%`,
                         width: loopB !== null ? `${Math.max(0, ((loopB - loopA) / duration) * 100)}%` : '2px'
                       }}
                     />
                   )}
                </div>

                <div className="flex-1 w-full flex flex-col gap-8">
                  {/* Loop A Picker */}
                  <div className="flex items-center justify-center gap-8">
                    <span className="text-white font-bold text-xl w-8">A</span>
                    <div className="flex items-center gap-2">
                      <ScrollPicker 
                        options={Array.from({ length: Math.floor(duration / 60) + 1 }, (_, i) => i)}
                        value={loopA !== null ? Math.floor(loopA / 60) : 0}
                        onChange={(val) => {
                          const currentSecs = loopA !== null ? loopA % 60 : 0;
                          setLoopA(Number(val) * 60 + currentSecs);
                        }}
                      />
                      <span className="text-white/40 font-bold">:</span>
                      <ScrollPicker 
                        options={Array.from({ length: 60 }, (_, i) => i)}
                        value={loopA !== null ? Math.floor(loopA % 60) : 0}
                        onChange={(val) => {
                          const currentMins = loopA !== null ? Math.floor(loopA / 60) : 0;
                          setLoopA(currentMins * 60 + Number(val));
                        }}
                      />
                      <span className="text-white/40 font-bold">.</span>
                      <ScrollPicker 
                        options={Array.from({ length: 1000 }, (_, i) => i)}
                        value={loopA !== null ? Math.floor((loopA % 1) * 1000) : 0}
                        onChange={(val) => {
                          const currentTotalSecs = loopA !== null ? Math.floor(loopA) : 0;
                          setLoopA(currentTotalSecs + Number(val) / 1000);
                        }}
                      />
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/5" />

                  {/* Loop B Picker */}
                  <div className="flex items-center justify-center gap-8">
                    <span className="text-white font-bold text-xl w-8">B</span>
                    <div className="flex items-center gap-2">
                      <ScrollPicker 
                        options={Array.from({ length: Math.floor(duration / 60) + 1 }, (_, i) => i)}
                        value={loopB !== null ? Math.floor(loopB / 60) : 0}
                        onChange={(val) => {
                          const currentSecs = loopB !== null ? loopB % 60 : 0;
                          setLoopB(Number(val) * 60 + currentSecs);
                        }}
                      />
                      <span className="text-white/40 font-bold">:</span>
                      <ScrollPicker 
                        options={Array.from({ length: 60 }, (_, i) => i)}
                        value={loopB !== null ? Math.floor(loopB % 60) : 0}
                        onChange={(val) => {
                          const currentMins = loopB !== null ? Math.floor(loopB / 60) : 0;
                          setLoopB(currentMins * 60 + Number(val));
                        }}
                      />
                      <span className="text-white/40 font-bold">.</span>
                      <ScrollPicker 
                        options={Array.from({ length: 1000 }, (_, i) => i)}
                        value={loopB !== null ? Math.floor((loopB % 1) * 1000) : 0}
                        onChange={(val) => {
                          const currentTotalSecs = loopB !== null ? Math.floor(loopB) : 0;
                          setLoopB(currentTotalSecs + Number(val) / 1000);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto w-full flex flex-col gap-4 mb-4">
                   <div className="flex items-center justify-between px-2 mb-2">
                     <span className="text-white/60 text-sm font-bold">Enable Loop</span>
                     <button 
                       onClick={() => setIsLooping(!isLooping)}
                       className={`w-12 h-6 rounded-full transition-colors relative ${isLooping ? 'bg-donezo-green' : 'bg-white/10'}`}
                     >
                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isLooping ? 'left-7' : 'left-1'}`} />
                     </button>
                   </div>
                   <button 
                    onClick={() => {
                      setIsEditingLoop(false);
                      setIsLooping(true); // Ensure looping is active when done
                      if (loopA !== null && audioRef.current) {
                        audioRef.current.currentTime = loopA;
                      }
                    }}
                    className="flex-1 py-4 bg-[#00A3FF] text-white font-bold rounded-2xl shadow-lg shadow-[#00A3FF]/20"
                   >
                     Done
                   </button>
                </div>
              </div>
            )}

            {/* Tempo & Pitch Controls */}
            <div className="space-y-4 md:space-y-6 flex-shrink-0">
              {/* Tempo */}
              <div className="space-y-1 md:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm md:text-base font-medium">Tempo</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00A3FF] text-sm md:text-base font-medium min-w-[3rem] text-center">{tempo}%</span>
                    <button onClick={() => setTempo(100)} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setTempo(prev => Math.max(50, prev - 1))}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                  </button>
                  <div className="relative flex-1 h-4 md:h-6 flex items-center">
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
                      className="absolute w-5 h-2.5 md:w-6 md:h-3 bg-white rounded-full shadow-lg pointer-events-none"
                      style={{ left: `calc(${((tempo - 50) / 150) * 100}% - ${windowWidth < 768 ? 10 : 12}px)` }}
                    ></div>
                  </div>
                  <button 
                    onClick={() => setTempo(prev => Math.min(200, prev + 1))}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>

              {/* Pitch */}
              <div className="space-y-1 md:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm md:text-base font-medium">Pitch</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00A3FF] text-sm md:text-base font-medium min-w-[3.5rem] text-center">
                      {pitch > 0 ? `+${pitch.toFixed(2)}` : pitch.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => setPitch(0)} 
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setPitch(prev => Math.max(-12, prev - 0.1))}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                  </button>
                  <div className="relative flex-1 h-4 md:h-6 flex items-center">
                    <div className="absolute w-full h-1 bg-white/10 rounded-full" />
                    <div 
                      className="absolute h-1 bg-[#00A3FF] rounded-full" 
                      style={{ width: `${((pitch + 12) / 24) * 100}%` }}
                    />
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
                      className="absolute w-5 h-2.5 md:w-6 md:h-3 bg-white rounded-full shadow-lg pointer-events-none"
                      style={{ left: `calc(${((pitch + 12) / 24) * 100}% - ${windowWidth < 768 ? 10 : 12}px)` }}
                    />
                  </div>
                  <button 
                    onClick={() => setPitch(prev => Math.min(12, prev + 0.1))}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>

              {/* Loop Controls */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm md:text-base font-medium">Loop</span>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button 
                      onClick={() => setIsEditingLoop(!isEditingLoop)}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${isEditingLoop ? 'bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/40' : 'bg-white/5 text-white/40 hover:text-white'}`}
                      title="Edit Loop Points"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={() => {
                        if (loopA === null) setLoopA(currentTime);
                        else setLoopA(null);
                      }}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${loopA !== null ? 'bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/40' : 'bg-white/5 text-white/40 hover:text-white'}`}
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
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${loopB !== null ? 'bg-[#00A3FF]/20 text-[#00A3FF] border border-[#00A3FF]/40' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    >
                      B
                    </button>
                    <button 
                      onClick={() => {
                        setLoopA(null);
                        setLoopB(null);
                        setIsLooping(false);
                      }}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {/* Loop Editor UI (Removed as it's now an overlay) */}
              </div>
            </div>

            {/* Waveform Visualizer */}
            <div 
              className="relative w-full flex-1 min-h-0 bg-black rounded-3xl overflow-hidden shadow-inner border border-white/5 cursor-pointer group flex-shrink touch-auto"
              onMouseDown={handleWaveformMouseDown}
              onMouseMove={handleWaveformMouseMove}
              onMouseUp={handleWaveformMouseUp}
              onTouchStart={handleWaveformTouchStart}
              onTouchMove={handleWaveformTouchMove}
              onTouchEnd={handleWaveformTouchEnd}
            >
              {/* Zoom Control */}
              <div className="absolute top-4 left-4 z-30" ref={zoomMenuRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowZoomMenu(!showZoomMenu);
                  }}
                  className={`p-2 backdrop-blur-md rounded-lg transition-colors border ${showZoomMenu ? 'bg-donezo-green/20 text-donezo-green border-donezo-green/50' : 'bg-black/40 text-white/60 hover:text-[#00A3FF] border-white/10'}`}
                  title="Waveform Zoom"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                
                {showZoomMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl w-32 animate-fade-in flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-hide">
                    <div className="px-2 py-1 mb-1">
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Zoom Level</span>
                    </div>
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(level => (
                      <button
                        key={level}
                        onClick={(e) => {
                          e.stopPropagation();
                          setWaveformZoom(level);
                          setShowZoomMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${waveformZoom === level ? 'bg-[#00A3FF] text-white shadow-lg shadow-[#00A3FF]/20' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                      >
                        Level {level}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <canvas 
                ref={fullScreenCanvasRef} 
                width={500} 
                height={384}
                className="w-full h-full block transition-opacity duration-300 group-hover:opacity-80"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-px h-full bg-white/10"></div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  addBookmark();
                }}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-[#00A3FF] hover:bg-white/10 transition-colors z-20"
                title="Add Bookmark"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </button>
              {/* Tooltip on hover */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
                Click waveform to seek
              </div>
            </div>

            {/* Seeker & Playback Controls */}
            <div className="space-y-3 md:space-y-4 flex-shrink-0 px-4 md:px-8">
              {/* Seek Slider */}
              <div className="space-y-1 md:space-y-2">
                <div className="relative h-6 md:h-8 flex items-center">
                  <div className="absolute w-full h-2 bg-white/10 rounded-full"></div>
                  <div ref={fsProgressRef} className="absolute h-2 bg-[#00A3FF] rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
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
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    ref={fsHandleRef}
                    className="absolute w-8 h-4 md:w-10 md:h-5 bg-white rounded-full shadow-lg pointer-events-none"
                    style={{ left: `calc(${(currentTime / duration) * 100}% - ${windowWidth < 768 ? 16 : 20}px)` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs md:text-sm font-medium text-white">
                  <span ref={fsTimeLabelRef}>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Playback Controls Row */}
              <div className="flex items-center justify-between px-0 md:px-4">
                <button 
                  onClick={toggleShuffle}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isShuffle ? 'bg-[#00A3FF] text-white shadow-lg shadow-[#00A3FF]/20' : 'bg-[#00A3FF]/10 text-[#00A3FF] hover:bg-[#00A3FF]/20'}`}
                  title="Shuffle"
                >
                  <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-2 md:gap-6">
                  <button className="text-[#00A3FF] hover:scale-110 transition-transform opacity-50 cursor-not-allowed hidden sm:block" title="Previous Track">
                    <svg className="w-8 h-8 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                  </button>
                  <button onClick={skipBackward} className="text-[#00A3FF] hover:scale-110 transition-transform" title="Rewind 10s">
                    <svg className="w-8 h-8 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
                  </button>
                  <button 
                    onClick={handleTogglePlay}
                    className="relative w-16 h-16 md:w-16 md:h-16 text-[#00A3FF] hover:scale-110 transition-transform"
                  >
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}>
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    </div>
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${!isPlaying ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`}>
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    {sleepTimer !== null && sleepTimer > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-donezo-green rounded-full border-2 border-black flex items-center justify-center animate-pulse z-10">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    )}
                  </button>
                  <button onClick={skipForward} className="text-[#00A3FF] hover:scale-110 transition-transform" title="Forward 10s">
                    <svg className="w-8 h-8 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M13 6v12l8.5-6L13 6zM4 6v12l8.5-6L4 6z"/></svg>
                  </button>
                  <button className="text-[#00A3FF] hover:scale-110 transition-transform opacity-50 cursor-not-allowed hidden sm:block" title="Next Track">
                    <svg className="w-8 h-8 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </button>
                </div>

                <button 
                  onClick={toggleRepeat}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${repeatMode !== 'off' ? 'bg-[#00A3FF] text-white shadow-lg shadow-[#00A3FF]/20' : 'bg-[#00A3FF]/10 text-[#00A3FF] hover:bg-[#00A3FF]/20'}`}
                  title="Repeat"
                >
                  {repeatMode === 'one' ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[9px] font-bold pt-0.5">1</span>
                    </div>
                  ) : (
                    <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  )}
                </button>
              </div>

              {/* Footer: Playing Next */}
              <div className="flex items-center justify-center gap-2 text-[#00A3FF] font-medium text-xs md:text-sm">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                <span className="truncate max-w-[250px]">Playing Next: {currentTrack.title}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Player */}
      <div className={`fixed bottom-0 right-0 bg-slate-950 text-white border-t border-slate-800 transition-all duration-300 z-50 ${isExpanded ? 'h-96' : 'h-24'} ${isSidebarCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-72'}`}>
        
        {/* Expanded View Content (Waveform) */}
        <div className={`absolute inset-x-0 top-0 bottom-24 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <canvas 
              ref={miniCanvasRef} 
              width={windowWidth} 
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
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 flex items-center justify-between px-4 md:px-6 z-10">
          
          {/* Track Info */}
          <div 
            className="flex items-center gap-3 lg:gap-4 w-auto max-w-[35%] lg:w-1/4 min-w-0 cursor-pointer group"
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
                    onClick={handleTogglePlay}
                    className="w-10 h-10 lg:w-12 lg:h-12 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
                 >
                     {isPlaying ? (
                         <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                     ) : (
                         <svg className="w-5 h-5 lg:w-6 lg:h-6 ml-[1px]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     )}
                 </button>
                 <button onClick={skipForward} className="hidden lg:block text-slate-400 hover:text-white transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" /></svg>
                 </button>
             </div>
             
             <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
                 <span ref={miniTimeLabelRef}>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                 <input 
                    ref={miniRangeRef}
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
                  className="hidden lg:block p-2 text-slate-400 hover:text-white transition-colors"
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
         onEnded={() => {
             if ((repeatMode === 'one' || (sleepTimer !== null && sleepTimer > 0)) && audioRef.current) {
                 audioRef.current.currentTime = 0;
                 audioRef.current.play();
             }
         }}
      />
    </>
  );
};

export default AudioPlayer;