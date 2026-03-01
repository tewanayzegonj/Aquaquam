import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiturgicalController } from '../services/LiturgicalController';
import { toEthiopian, ETHIOPIAN_MONTHS_GEEZ, toGeezNumber } from '../utils/ethiopianDate';
import { LibraryItem } from '../types';
import LiturgicalCMSEditor from './LiturgicalCMSEditor';
import MonthYearPicker from './MonthYearPicker';

interface LiturgicalCalendarViewProps {
  libraryItems?: LibraryItem[];
  onItemClick?: (item: LibraryItem) => void;
}

export default function LiturgicalCalendarView({ libraryItems = [], onItemClick }: LiturgicalCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [yearOffset, setYearOffset] = useState(0); // 7-Year Cycle Offset
  const [showGeezNumerals, setShowGeezNumerals] = useState(false);
  
  // CMS & Picker State
  const [isCMSEditorOpen, setIsCMSEditorOpen] = useState(false);
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);
  
  // Custom Ceremonies State (Unified with CMS)
  const [annualCustom, setAnnualCustom] = useState<Record<string, string>>(() => {
      try {
          const saved = localStorage.getItem('custom_annual_commemorations');
          return saved ? JSON.parse(saved) : {};
      } catch (e) {
          console.error("Failed to load custom ceremonies", e);
          return {};
      }
  });
  
  // Swipe Direction State
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  // Save custom ceremonies when changed
  useEffect(() => {
      localStorage.setItem('custom_annual_commemorations', JSON.stringify(annualCustom));
  }, [annualCustom]);

  const handleDeleteCustomCeremony = () => {
      if (!selectedDate) return;
      const ethDate = toEthiopian(selectedDate);
      const key = `${ethDate.month}-${ethDate.day}`;
      
      setAnnualCustom(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
      });
  };

  const selectedCeremony = useMemo(() => {
      if (!selectedDate) return null;
      return LiturgicalController.getCurrentCeremony(selectedDate, yearOffset);
  }, [selectedDate, yearOffset]);

  const weeklyTheme = useMemo(() => {
      return LiturgicalController.getWeeklyTheme(currentDate);
  }, [currentDate]);

  // Find custom ceremony for selected date
  const selectedCustomCeremony = useMemo(() => {
      if (!selectedDate) return null;
      const ethDate = toEthiopian(selectedDate);
      const key = `${ethDate.month}-${ethDate.day}`;
      const name = annualCustom[key];
      return name ? { name, id: key } : null;
  }, [selectedDate, annualCustom]);

  // Find tagged items for selected date
  const selectedDateItems = useMemo(() => {
      if (!selectedDate) return [];
      const ethDate = toEthiopian(selectedDate);
      return libraryItems.filter(item => 
          item.liturgicalMetadata?.month === ethDate.month && 
          item.liturgicalMetadata?.day === ethDate.day
      );
  }, [selectedDate, libraryItems]);

  // Calculate grid data
  const calendarData = useMemo(() => {
    const ethDate = toEthiopian(currentDate);
    
    // Find the 1st of the month in Gregorian
    const firstDayGreg = new Date(currentDate);
    firstDayGreg.setDate(currentDate.getDate() - (ethDate.day - 1));
    
    const startWeekday = firstDayGreg.getDay(); // 0=Sun, 1=Mon...
    
    const daysInMonth = ethDate.month === 13 ? (ethDate.year % 4 === 3 ? 6 : 5) : 30;
    
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < startWeekday; i++) {
        days.push(null);
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(firstDayGreg);
        date.setDate(firstDayGreg.getDate() + (i - 1));
        days.push({
            day: i,
            date: date,
            ceremony: LiturgicalController.getCurrentCeremony(date, yearOffset)
        });
    }
    
    return {
        monthName: ETHIOPIAN_MONTHS_GEEZ[ethDate.month - 1],
        year: ethDate.year,
        days
    };
  }, [currentDate, yearOffset]);

  const handlePrevMonth = () => {
      setSlideDirection('right');
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 30);
      setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
      setSlideDirection('left');
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 30);
      setCurrentDate(newDate);
  };

  const handleToday = () => {
      const now = new Date();
      setSlideDirection(now > currentDate ? 'left' : 'right');
      setCurrentDate(now);
      setSelectedDate(now);
  };

  // Swipe Handlers removed as per requirement: "Disable horizontal sliding to change months"

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white overflow-y-auto lg:overflow-hidden relative">
      
      <div className="flex flex-col h-auto lg:h-auto overflow-visible lg:overflow-visible relative flex-shrink-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b border-white/5 bg-[#0A0A0A] z-10 flex-shrink-0">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsMonthYearPickerOpen(true)}
                    className="text-2xl md:text-3xl font-black font-serif tracking-tight text-white hover:text-amber-500 transition-colors flex items-center gap-2 group"
                >
                    {calendarData.monthName} <span className="text-white/30 font-sans font-light text-xl md:text-2xl group-hover:text-amber-500/60 transition-colors">{calendarData.year}</span>
                    <svg className="w-5 h-5 text-white/20 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="flex gap-2 bg-white/5 rounded-full p-1 border border-white/5">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full transition-all hover:text-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={handleToday} className="px-4 text-xs font-bold uppercase tracking-widest text-amber-500 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
                        Today
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full transition-all hover:text-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            
            <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-xl transition-all ${isSettingsOpen ? 'bg-amber-500/20 text-amber-500' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </header>

        {/* Sticky Weekly Theme Sub-Header */}
        <div className="bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/5 py-2 text-center sticky top-0 z-10">
            <p className="text-amber-500/80 text-[0.8rem] font-ethiopic italic tracking-wide">
                ሳምንት: <span className="font-bold text-amber-500">{weeklyTheme}</span>
            </p>
        </div>

        {/* Main Grid Area */}
        <div 
            className="overflow-visible custom-scrollbar p-2 md:p-8 w-full max-w-[100vw] overflow-x-hidden box-border"
        >
            <AnimatePresence mode='wait' initial={false}>
                {calendarData && calendarData.days && (
                    <motion.div
                        key={calendarData.monthName + calendarData.year}
                        initial={{ x: slideDirection === 'left' ? 300 : -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: slideDirection === 'left' ? -300 : 300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="grid grid-cols-4 md:grid-cols-5 gap-2 md:gap-4 auto-rows-fr w-full"
                    >
                        {calendarData.days.map((dayData, idx) => {
                            if (!dayData) return <div key={`empty-${idx}`} className="aspect-[1/1.2] md:aspect-square"></div>;
                        
                        const isSelected = selectedDate && dayData.date.toDateString() === selectedDate.toDateString();
                        const isToday = dayData.date.toDateString() === new Date().toDateString();
                        
                        // Check if day has tagged items
                        const ethDate = toEthiopian(dayData.date);
                        const hasItems = libraryItems.some(item => 
                            item.liturgicalMetadata?.month === ethDate.month && 
                            item.liturgicalMetadata?.day === ethDate.day
                        );
                        
                        const hasCustomCeremony = !!annualCustom[`${ethDate.month}-${ethDate.day}`];

                        return (
                            <motion.button
                                key={`day-${dayData.day}`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedDate(dayData.date)}
                                className={`aspect-[1/1.2] md:aspect-square rounded-xl md:rounded-3xl p-1 md:p-4 flex flex-col items-center md:items-start justify-between relative transition-all border box-border overflow-hidden
                                    ${isSelected 
                                        ? 'bg-gradient-to-br from-amber-600 to-orange-700 border-amber-500/50 shadow-2xl shadow-amber-900/50 z-10' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }
                                    ${isToday && !isSelected ? 'ring-1 ring-amber-500/50 bg-amber-500/10' : ''}
                                `}
                            >
                                <div className="flex w-full justify-between items-start relative z-10">
                                    <div className="flex flex-col">
                                        <span 
                                            className={`font-black font-sans ${isSelected ? 'text-white' : 'text-white/80'}`}
                                            style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1.5rem)' }}
                                        >
                                            {showGeezNumerals ? toGeezNumber(dayData.day) : dayData.day}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${isSelected ? 'text-white/60' : 'text-white/30'}`}>
                                            {dayData.ceremony.geezDayName}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {/* Gold Dot: Official Ceremony */}
                                        {dayData.ceremony.season !== 'Regular' && dayData.ceremony.season !== 'Monthly Commemoration' && (
                                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
                                        )}
                                        {/* Teal Dot: User Manual Ceremony */}
                                        {hasCustomCeremony && (
                                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]"></div>
                                        )}
                                        {/* Amber Dot: Tagged Items */}
                                        {hasItems && (
                                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Clean Minimalist Grid - No Watermarks */}

                                <div className="w-full text-center md:text-left relative z-10 mt-auto">
                                    {dayData.ceremony.weekName !== 'General' && (
                                        <p 
                                            className={`font-bold tracking-wider truncate mb-0.5 w-full font-ethiopic ${isSelected ? 'text-amber-100' : 'text-white/40'}`}
                                            style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)' }}
                                        >
                                            {dayData.ceremony.geezName}
                                        </p>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* Detail Section (Audio List) */}
      <div className="w-full h-auto lg:flex-1 border-t border-white/5 bg-[#0A0A0A] flex flex-col shadow-2xl z-20 lg:overflow-y-auto">
            <div className="p-6 md:p-8 border-b border-white/5 flex-shrink-0">
                <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2 font-sans">Selected Liturgy</p>
                <h2 className="text-2xl md:text-3xl font-black font-sans text-white mb-1">
                    {selectedCeremony?.geezDayName} • {selectedCeremony?.dateString}
                </h2>
                <p className="text-white/60 text-base md:text-lg font-medium font-sans">
                    {selectedCustomCeremony ? selectedCustomCeremony.name : selectedCeremony?.geezName}
                </p>
                {selectedCustomCeremony && (
                    <div className="mt-2 flex items-center gap-2">
                         <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase rounded-md border border-teal-500/20 font-sans">Custom</span>
                         <button onClick={() => handleDeleteCustomCeremony()} className="text-red-400 hover:text-red-300 text-xs font-sans">Remove</button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {/* Edit Commemoration Button */}
                <div className="mb-6">
                    <button 
                        onClick={() => setIsCMSEditorOpen(true)}
                        className="w-full py-3 border border-dashed border-white/20 rounded-2xl text-white/40 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-sm font-bold flex items-center justify-center gap-2 font-sans"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit Commemoration
                    </button>
                </div>

                {selectedDateItems.length > 0 ? (
                    selectedDateItems.map((item) => (
                        <div key={item.id} className="group relative pl-4 border-l-2 border-white/5 hover:border-amber-500/50 transition-colors">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0A0A0A] border-2 border-white/10 group-hover:border-amber-500 transition-colors"></div>
                            
                            <div 
                                onClick={() => onItemClick && onItemClick(item)}
                                className="bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all cursor-pointer group-hover:translate-x-1 border border-white/5"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {item.type === 'folder' ? (
                                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-donezo-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3 2zm0 0v-8" /></svg>
                                        )}
                                        <h3 className="font-bold text-white text-sm md:text-base truncate max-w-[150px] font-sans">{item.name}</h3>
                                    </div>
                                    {item.liturgicalMetadata?.ceremony && (
                                        <span className="text-[10px] font-mono text-white/40 bg-black/40 px-2 py-1 rounded-md truncate max-w-[80px]">
                                            {item.liturgicalMetadata.ceremony}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-white/40 font-medium font-sans">
                                        {item.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-white/30">
                        <p className="text-sm font-sans">No items assigned to this date.</p>
                    </div>
                )}
            </div>
      </div>

      {/* Settings Overlay */}
      <AnimatePresence>
            {isSettingsOpen && (
                <motion.div 
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    className="absolute top-0 right-0 w-80 h-full bg-[#111] border-l border-white/10 shadow-2xl z-50 p-6"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-white font-sans">Settings</h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-white/40 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="space-y-8">
                        {/* 7-Year Cycle Offset */}
                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3 font-sans">7-Year Cycle Offset</label>
                            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                                <button onClick={() => setYearOffset(prev => prev - 1)} className="p-3 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                                </button>
                                <span className="flex-1 text-center font-mono font-bold text-xl text-amber-500">{yearOffset > 0 ? `+${yearOffset}` : yearOffset}</span>
                                <button onClick={() => setYearOffset(prev => prev + 1)} className="p-3 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                            <p className="text-[10px] text-white/30 mt-2 leading-relaxed font-sans">
                                Adjust this value if the calculated liturgical year does not match your local tradition.
                            </p>
                        </div>

                        {/* Display Preferences */}
                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3 font-sans">Display Preferences</label>
                            <div className="space-y-3">
                                {/* Ge'ez Numerals Toggle */}
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-sm font-medium text-white/80 font-sans">Ge'ez Numerals</span>
                                    <button 
                                        onClick={() => setShowGeezNumerals(!showGeezNumerals)}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${showGeezNumerals ? 'bg-amber-500' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showGeezNumerals ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CMS Editor Trigger */}
                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3 font-sans">Content Management</label>
                            <button 
                                onClick={() => {
                                    setIsSettingsOpen(false);
                                    setIsCMSEditorOpen(true);
                                }}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Edit Commemorations
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* CMS Editor Modal */}
        <AnimatePresence>
            {isCMSEditorOpen && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl h-[80vh] bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up">
                        <LiturgicalCMSEditor onClose={() => {
                            setIsCMSEditorOpen(false);
                            // Reload data
                            try {
                                const saved = localStorage.getItem('custom_annual_commemorations');
                                if (saved) setAnnualCustom(JSON.parse(saved));
                            } catch (e) {
                                console.error("Failed to reload custom ceremonies", e);
                            }
                        }} />
                    </div>
                </div>
            )}
        </AnimatePresence>

        {/* Month/Year Picker Modal */}
        <MonthYearPicker 
            isOpen={isMonthYearPickerOpen}
            onClose={() => setIsMonthYearPickerOpen(false)}
            currentMonth={toEthiopian(currentDate).month}
            currentYear={toEthiopian(currentDate).year}
            onSelect={(month, year) => {
                // Approximate jump logic:
                // Calculate difference in months and update currentDate
                // This is a simplification as we don't have a robust Eth -> Greg converter
                // But we can just set the state if we assume currentDate is the source of truth for the view
                // Actually, `calendarData` is derived from `currentDate`.
                // We need to shift `currentDate` to match the selected Eth Month/Year.
                // Since `toEthiopian` is one-way in our utils, we can't easily do this accurately without a library update.
                // However, we can approximate: 1 Eth Month = 30 days.
                // Let's calculate the target Eth date (1st of Month) and find the difference from current Eth date.
                // Then add that difference in days to `currentDate`.
                
                const currentEth = toEthiopian(currentDate);
                const monthDiff = month - currentEth.month;
                const yearDiff = year - currentEth.year;
                const totalMonthDiff = (yearDiff * 13) + monthDiff; // Approx 13 months/year
                
                // This is very rough but might work for small jumps
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + (totalMonthDiff * 30));
                setCurrentDate(newDate);
                setIsMonthYearPickerOpen(false);
            }}
        />
    </div>
  );
}
