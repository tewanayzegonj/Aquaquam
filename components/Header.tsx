import React from 'react';
import { Category, DayData, User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  selectedMonth: Category;
  selectedDay: DayData | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser,
  onToggleSidebar, 
  isDarkMode, 
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  onLogout
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-20 bg-white dark:bg-donezo-card-dark border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0 z-20">
      <div className="flex items-center gap-6">
        <button 
          onClick={onToggleSidebar}
          className="p-2.5 bg-slate-50 dark:bg-slate-800