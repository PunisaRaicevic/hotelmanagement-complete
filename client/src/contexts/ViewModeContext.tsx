import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ViewMode = 'web' | 'mobile';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isMobileView: boolean;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('viewMode');
    return (saved as ViewMode) || 'web';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);

    // Add/remove class on body for global CSS targeting
    if (viewMode === 'mobile') {
      document.body.classList.add('mobile-view');
      document.body.classList.remove('web-view');
    } else {
      document.body.classList.add('web-view');
      document.body.classList.remove('mobile-view');
    }
  }, [viewMode]);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'web' ? 'mobile' : 'web');
  };

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        isMobileView: viewMode === 'mobile',
        toggleViewMode
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
