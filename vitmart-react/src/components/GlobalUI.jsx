import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GlobalUI() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Initial Page Loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // simulate some loading time for the cool rings
    return () => clearTimeout(timer);
  }, []);

  // Scroll logic for Progress & BackToTop
  useEffect(() => {
    const handleScroll = () => {
      // Progress
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);

      // BackToTop
      setShowBackToTop(winScroll > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cmd+K logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCmdPalette(prev => !prev);
        setCmdSearch('');
      }
      if (e.key === 'Escape' && showCmdPalette) {
        setShowCmdPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCmdPalette]);

  // Lightbox logic
  useEffect(() => {
    const handleLightbox = (e) => setLightboxImg(e.detail);
    window.addEventListener('open-lightbox', handleLightbox);
    return () => window.removeEventListener('open-lightbox', handleLightbox);
  }, []);

  const handleCmdAction = (path) => {
    setShowCmdPalette(false);
    navigate(path);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dummy command palette results for visual parity
  const cmdResults = [
    { label: '🛒 Browse Marketplace', path: '/buy' },
    { label: '💰 Sell an Item', path: '/sell' },
    { label: '📌 Campus Noticeboard', path: '/noticeboard' },
    { label: '⭐ Write a Review', path: '/reviews' },
    { label: '🔍 Lost & Found', path: '/lost-and-found' }
  ].filter(r => r.label.toLowerCase().includes(cmdSearch.toLowerCase()));

  return (
    <>
      {/* 1. Page Loader */}
      {isLoading && (
        <div id="page-loader" className="fixed inset-0 z-[100] bg-[#0f0a1e] flex flex-col items-center justify-center transition-opacity duration-500">
          <div className="loader-rings relative w-24 h-24 mb-6">
            <div className="loader-ring absolute inset-0 border-2 border-transparent border-t-vit-500 rounded-full animate-spin"></div>
            <div className="loader-ring absolute inset-2 border-2 border-transparent border-r-cyan-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
            <div className="loader-ring absolute inset-4 border-2 border-transparent border-b-rose-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
          </div>
          <div className="loader-text text-white text-2xl font-black tracking-widest uppercase mb-1">ViTMART</div>
          <div className="loader-sub text-gray-400 text-sm tracking-widest uppercase">Your campus marketplace</div>
          <div className="w-[120px] h-[2px] bg-vit-500/15 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-gradient-to-r from-vit-600 via-cyan-500 to-rose-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      {/* 2. Scroll Progress */}
      <div 
        className="fixed top-0 left-0 h-[2.5px] bg-gradient-to-r from-vit-600 via-cyan-500 to-rose-500 z-[9998] transition-all duration-75 ease-linear shadow-[0_0_14px_rgba(139,92,246,0.8)]"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* 3. Back to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-24 left-6 sm:bottom-6 sm:left-6 w-12 h-12 bg-white dark:bg-vit-800 text-vit-600 dark:text-white rounded-xl shadow-xl flex items-center justify-center z-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-vit-500/30 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Back to top"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"/>
        </svg>
      </button>

      {/* 4. Command Palette */}
      {showCmdPalette && (
        <div className="fixed inset-0 bg-gray-950/70 backdrop-blur-md z-[9000] flex items-start justify-center pt-[12vh] px-4 animate-fade-in" onClick={() => setShowCmdPalette(false)}>
          <div className="glass-strong w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl shadow-vit-500/30 border border-vit-500/30 animate-subtle-pop" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-vit-500/10">
              <svg className="w-5 h-5 text-vit-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input 
                autoFocus
                type="text" 
                placeholder="Search pages, items, actions..." 
                className="flex-grow bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 font-medium text-sm"
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
              />
              <span className="px-2 py-1 bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded text-xs font-bold font-mono">ESC</span>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto space-y-0.5">
              {cmdResults.length > 0 ? (
                cmdResults.map((r, i) => (
                  <button key={i} onClick={() => handleCmdAction(r.path)} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-vit-50 dark:hover:bg-white/5 hover:text-vit-600 dark:hover:text-vit-400 transition-colors flex items-center gap-3">
                    {r.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">No results found for "{cmdSearch}"</div>
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-vit-500/10 flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded font-mono">↑↓</span> Navigate</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded font-mono">↵</span> Select</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded font-mono">ESC</span> Close</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Image Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxImg(null)}>
          <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white text-xl z-10 transition-colors">
            &times;
          </button>
          <img src={lightboxImg} className="max-w-full max-h-full object-contain rounded-lg animate-subtle-pop" alt="Fullscreen preview" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
