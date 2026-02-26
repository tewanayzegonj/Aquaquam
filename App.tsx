import React, { useState, useEffect } from 'react';
import { MOCK_DB, DEFAULT_CATEGORIES } from './constants';
import { Category, DayData, Track, NavItemType, LibraryItem, User } from './types';
import AudioPlayer from './components/AudioPlayer.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import LibraryView from './components/LibraryView.tsx';
import AuthView from './components/AuthView.tsx';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('zema_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('eotc_theme');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [searchQuery, setSearchQuery] = useState("");
  
  const [categories, setCategories] = useState<NavItemType[]>(() => {
    const saved = localStorage.getItem('eotc_categories');
    if (saved) return JSON.parse(saved);
    return DEFAULT_CATEGORIES.map((name, index) => ({
      id: `cat_${index}`,
      name,
      isDefault: true
    }));
  });
  
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(() => {
    const saved = localStorage.getItem('eotc_library_items');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Dashboard'>('Dashboard');
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(() => {
    const saved = localStorage.getItem('eotc_recent');
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<Track[]>(() => {
    const saved = localStorage.getItem('eotc_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Initial load from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          if (data.categories && data.categories.length > 0) setCategories(data.categories);
          if (data.libraryItems) setLibraryItems(data.libraryItems);
          if (data.favorites) setFavorites(data.favorites);
        }
      } catch (error) {
        console.error("Failed to fetch data from backend:", error);
      }
    };
    fetchData();
  }, []);

  // Sync to backend
  useEffect(() => {
    const syncData = async () => {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories, libraryItems, favorites })
        });
      } catch (error) {
        console.error("Failed to sync data to backend:", error);
      }
    };
    
    // Debounce sync
    const timer = setTimeout(syncData, 1000);
    return () => clearTimeout(timer);
  }, [categories, libraryItems, favorites]);

  useEffect(() => {
    localStorage.setItem('eotc_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('eotc_library_items', JSON.stringify(libraryItems));
  }, [libraryItems]);

  useEffect(() => {
    localStorage.setItem('eotc_recent', JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  useEffect(() => {
    localStorage.setItem('eotc_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('eotc_theme', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('zema_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('zema_session');
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id !== track.id) {
      setCurrentTrack(track);
      setRecentlyPlayed(prev => {
        const filtered = prev.filter(t => t.id !== track.id);
        return [track, ...filtered].slice(0, 10);
      });
    }
    setIsPlaying(true);
  };
  
  const handleClosePlayer = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const toggleFavorite = (track: Track) => {
    setFavorites(prev => {
      const isFav = prev.find(t => t.id === track.id);
      if (isFav) {
        return prev.filter(t => t.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  };

  const handleAddCategory = (name: string) => {
    const newCat: NavItemType = {
      id: `cat_${Date.now()}`,
      name,
      isDefault: false
    };
    setCategories(prev => [...prev, newCat]);
    setSelectedCategory(name);
  };

  const handleEditCategory = (id: string, newName: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === id) {
        if (selectedCategory === cat.name) {
          setSelectedCategory(newName);
        }
        return { ...cat, name: newName };
      }
      return cat;
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => {
      const filtered = prev.filter(cat => cat.id !== id);
      const deletedItem = prev.find(c => c.id === id);
      if (deletedItem && deletedItem.name === selectedCategory && filtered.length > 0) {
        setSelectedCategory(filtered[0].name);
      } else if (deletedItem && deletedItem.name === selectedCategory) {
        setSelectedCategory('Dashboard');
      }
      return filtered;
    });
  };

  const handleReorderCategories = (newCategories: NavItemType[]) => {
    setCategories(newCategories);
  };

  const handleAddLibraryItem = (item: LibraryItem) => {
    setLibraryItems(prev => [...prev, item]);
  };

  const handleUpdateLibraryItem = (id: string, updates: Partial<LibraryItem>) => {
    setLibraryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteLibraryItem = (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const deleteRecursive = (items: LibraryItem[], targetId: string): LibraryItem[] => {
        const children = items.filter(i => i.parentId === targetId);
        let remaining = items.filter(i => i.id !== targetId);
        children.forEach(child => {
            remaining = deleteRecursive(remaining, child.id);
        });
        return remaining;
    };
    setLibraryItems(prev => {
        let current = prev;
        ids.forEach(id => {
            current = deleteRecursive(current, id);
        });
        return current;
    });
  };

  const handleReorderLibraryItems = (newItems: LibraryItem[]) => {
    setLibraryItems(newItems);
  };

  if (!currentUser) {
    return <AuthView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (selectedCategory === 'Dashboard') {
      return (
        <Dashboard 
          currentTrack={currentTrack}
          recentlyPlayed={recentlyPlayed}
          favorites={favorites}
          onPlay={handlePlayTrack}
          onToggleFavorite={toggleFavorite}
        />
      );
    }

    return (
      <LibraryView 
        categoryId={selectedCategory}
        items={libraryItems}
        favorites={favorites}
        onAddItem={handleAddLibraryItem}
        onUpdateItem={handleUpdateLibraryItem}
        onDeleteItem={handleDeleteLibraryItem}
        onReorderItems={handleReorderLibraryItems}
        onPlayTrack={handlePlayTrack}
        onToggleFavorite={toggleFavorite}
        currentTrackId={currentTrack?.id}
      />
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-donezo-bg dark:bg-donezo-dark transition-colors duration-300">
      
      {!isSidebarCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-[55] transition-opacity animate-fade-in"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        categories={categories}
        selectedCategory={selectedCategory as Category}
        onSelectCategory={(cat) => { 
          setSelectedCategory(cat); 
          setIsSidebarCollapsed(true); 
        }}
        onSelectDay={setSelectedDay}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onReorderCategories={handleReorderCategories}
        db={MOCK_DB}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-72'}`}>
        <Header 
          currentUser={currentUser}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          selectedMonth={selectedCategory}
          selectedDay={selectedDay}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto relative scrollbar-hide">
           <div className="max-w-[1400px] mx-auto w-full">
              {renderContent()}
           </div>
        </main>
      </div>

      <AudioPlayer 
        key={currentTrack?.id || 'none'}
        currentTrack={currentTrack} 
        isPlaying={isPlaying} 
        onTogglePlay={() => setIsPlaying(!isPlaying)} 
        onClose={handleClosePlayer}
        isSidebarCollapsed={isSidebarCollapsed}
      />
    </div>
  );
};

export default App;