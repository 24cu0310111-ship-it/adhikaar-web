import React, { useState, useEffect } from 'react';
import { ExternalLink, ArrowLeft, Send } from 'lucide-react';
import { ProjectShowcasePanel } from './components/ProjectShowcasePanel';
import { ScrollAnimationPanel } from './components/ScrollAnimationPanel';
import { launchTelegramBot } from './utils/telegram';

export default function App() {
  const isGetStartedPath = typeof window !== 'undefined' && 
    (window.location.pathname === '/Get-started' || window.location.pathname.toLowerCase() === '/get-started');

  const [activePanel, setActivePanel] = useState<'showcase' | 'motion'>(
    isGetStartedPath ? 'motion' : 'showcase'
  );

  // Sync state with browser URL popstate (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const isGetStarted = window.location.pathname === '/Get-started' || window.location.pathname.toLowerCase() === '/get-started';
      setActivePanel(isGetStarted ? 'motion' : 'showcase');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLaunchMotion = () => {
    window.history.pushState(null, '', '/Get-started');
    setActivePanel('motion');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBackToOverview = () => {
    window.history.pushState(null, '', '/');
    setActivePanel('showcase');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="w-full min-h-screen bg-[#000000] text-[#ffffff]">
      {/* Stark Monochrome Navigation with ambient light pass-through */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#000000]/65 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4">
          {activePanel === 'motion' ? (
            <button
              type="button"
              onClick={handleBackToOverview}
              className="flex items-center gap-2 px-3 py-1.5 rounded surface-card-interactive text-xs font-mono text-[#d4d4d8] hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK TO HOME</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span className="font-display font-bold text-sm tracking-wider uppercase text-white">
                ADHIKAAR AI
              </span>
            </div>
          )}
          <span className="text-[#333333] text-xs">|</span>
          <span className="font-mono text-xs text-[#888888] hidden sm:inline">
            AUTONOMOUS WELFARE ENTITLEMENT SYSTEM
          </span>
        </div>

        {/* Right Nav Items */}
        <div className="flex items-center gap-3">
          {/* Project Overview External Link to GitHub */}
          <a
            href="https://github.com/kolatidheeraj013/ADHIKAAR_AI.git"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded text-xs font-mono font-medium surface-card text-[#d4d4d8] hover:text-white flex items-center gap-1.5 transition-colors border border-[#222222]"
          >
            <span>PROJECT OVERVIEW</span>
            <ExternalLink className="w-3 h-3 text-[#888888]" />
          </a>

          {/* Telegram Bot Link with Single-Click Fallback */}
          <button
            type="button"
            onClick={launchTelegramBot}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-sans font-semibold text-xs transition-colors cursor-pointer"
            title="Single-click: opens Web Client A with automatic Web Client K fallback"
          >
            <Send className="w-3 h-3 fill-black" />
            <span>@Adhikaar013bot</span>
          </button>
        </div>
      </nav>

      {/* Main View Router */}
      <main className="w-full">
        {activePanel === 'showcase' ? (
          <ProjectShowcasePanel onGetStarted={handleLaunchMotion} />
        ) : (
          <ScrollAnimationPanel onBackToOverview={handleBackToOverview} />
        )}
      </main>
    </div>
  );
}
