import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { auth } from '../../config/firebase';
import ThemeToggle from '../ThemeToggle';
import NotificationsDropdown from '../NotificationsDropdown';

export default function Layout() {
  const { currentUser, openAuthModal } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };
  return (
    <div id="app-container" className="min-h-screen flex flex-col transition-opacity duration-500">
      <header id="app-header" className="glass-strong py-4 px-4 sm:px-6 sticky top-0 z-30 transition-all duration-300">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5 group" style={{ textDecoration: 'none' }}>
            <div className="w-9 h-9 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-vit-500/50 transition-all duration-300 group-hover:scale-105">⚡</div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight grad-text-vp">ViTMART</span>
              <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '9px', letterSpacing: '0.12em', fontWeight: 600, textTransform: 'uppercase' }}>Campus Marketplace</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center space-x-5 text-sm text-gray-600 dark:text-gray-300 font-semibold overflow-x-auto no-scrollbar">
            <Link to="/" className="nav-item whitespace-nowrap">Home</Link>
            <Link to="/buy" className="nav-item whitespace-nowrap">Buy</Link>
            <Link to="/buy?tab=trade" className="nav-item whitespace-nowrap">Trade</Link>
            <Link to="/sell" className="nav-item whitespace-nowrap">Sell</Link>
            <Link to="/lost-and-found" className="nav-item whitespace-nowrap">Lost & Found</Link>
            <Link to="/profile?tab=listings" className="nav-item whitespace-nowrap">My Listings</Link>
            <Link to="/profile?tab=orders" className="nav-item whitespace-nowrap">My Orders</Link>
            <Link to="/reviews" className="nav-item whitespace-nowrap">⭐ Reviews</Link>
            <Link to="/noticeboard" className="nav-item whitespace-nowrap">📌 Board</Link>
            <Link to="/manage" className="nav-item whitespace-nowrap">🗑️ Manage</Link>
          </nav>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <ThemeToggle />
            {currentUser ? (
              <>
                <NotificationsDropdown />
                <button onClick={() => navigate('/manage')} className="icon-btn p-2 rounded-xl glass hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-200">
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </button>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-600 hover:text-vit-600 dark:text-gray-300 dark:hover:text-cyan-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f0a1e]">{cartCount}</span>}
                </button>
                <button onClick={() => navigate('/profile')} className="icon-btn transition-all duration-200 hover:scale-105 rounded-xl">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} className="h-9 w-9 rounded-xl object-cover ring-2 ring-vit-500/50" alt="Profile" />
                  ) : (
                    <div className="h-9 w-9 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white text-sm">
                      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>
                <button onClick={handleLogout} className="hidden sm:block px-4 py-2 glass rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-vit-500/20 hover:-translate-y-0.5 transition-all">Sign Out</button>
              </>
            ) : (
              <button onClick={openAuthModal} className="px-5 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white text-sm font-semibold rounded-xl shimmer-btn shadow-lg shadow-vit-500/30">
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="relative overflow-hidden bg-white dark:bg-[#080510] text-gray-900 dark:text-white border-t border-gray-200 dark:border-vit-900/50 pb-20 sm:pb-0 transition-colors duration-300">
        <div className="orb orb-purple w-64 h-64 opacity-5 dark:opacity-10 -bottom-20 -left-10"></div>
        <div className="orb orb-cyan w-48 h-48 opacity-5 dark:opacity-10 -top-10 right-20"></div>
        <div className="container mx-auto py-10 px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-lg flex items-center justify-center text-sm font-bold text-white">⚡</div>
              <span className="text-lg font-bold font-syne grad-text-vp">ViTMART</span>
            </div>
            <div className="text-sm text-gray-500 order-3 md:order-1">&copy; {new Date().getFullYear()} ViTMART. All rights reserved.</div>
            <div className="flex space-x-5">
              <a href="#" className="text-gray-500 hover:text-vit-600 dark:hover:text-vit-400 transition-colors">Instagram</a>
              <a href="#" className="text-gray-500 hover:text-vit-600 dark:hover:text-vit-400 transition-colors">Twitter</a>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAV */}
      <nav id="mobile-bottom-nav" className="sm:hidden fixed bottom-0 w-full bg-white/90 dark:bg-[#080614]/90 backdrop-blur-xl border-t border-vit-500/10 flex items-center justify-around pb-safe pt-2 z-40 px-2 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)]">
        <Link to="/" className="mob-nav-item flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-vit-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link to="/buy" className="mob-nav-item flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-vit-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          <span className="text-[10px] font-bold">Buy</span>
        </Link>
        <Link to="/sell" className="mob-nav-item flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-vit-600 relative">
          <div className="w-11 h-11 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-vit-500/50 -mt-5 text-2xl font-light">+</div>
          <span className="text-[10px] font-bold">Sell</span>
        </Link>
        <Link to="/noticeboard" className="mob-nav-item flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-vit-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
          <span className="text-[10px] font-bold">Board</span>
        </Link>
        <Link to="/profile" className="mob-nav-item flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-vit-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
