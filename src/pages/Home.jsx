import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { useProducts } from '../contexts/ProductsContext';
import ProductCard from '../components/ProductCard';
import Recommendations from '../components/Recommendations';

const tickerItems = [
  { icon: '⚡', label: 'ViTMART', accent: true },
  { icon: '📚', label: 'Textbooks & Study Material', accent: false },
  { icon: '💻', label: 'Electronics & Gadgets', accent: false },
  { icon: '🔄', label: 'Trade & Barter', accent: true },
  { icon: '🛋️', label: 'Furniture & Decor', accent: false },
  { icon: '🛡️', label: 'Verified Students Only', accent: true },
];

export default function Home() {
  const { products, loading } = useProducts();
  const navigate = useNavigate();
  const [lfItems, setLfItems] = useState([]);
  const [loadingLF, setLoadingLF] = useState(true);

  // Sort and filter top 4 products
  const recentProducts = [...products]
    .filter(p => p.status === 'available')
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    })
    .slice(0, 4);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-section').forEach(section => {
      observer.observe(section);
    });

    const qLF = query(
      collection(db, 'lost_and_found'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubLF = onSnapshot(qLF, (snap) => {
      setLfItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingLF(false);
    });

    return () => {
      observer.disconnect();
      unsubLF();
    };
  }, []);

  return (
    <div className="home-page-wrapper">
      {/* HERO */}
      <section className="hero-bg relative overflow-hidden noise min-h-[92vh] flex items-center -mt-8">
        <div className="orb orb-purple w-[500px] h-[500px] top-10 -left-32 opacity-30"></div>
        <div className="orb orb-cyan w-[400px] h-[400px] bottom-0 right-0 opacity-20"></div>
        <div className="orb orb-rose w-72 h-72 top-1/2 right-1/4 opacity-15"></div>
        <div className="absolute inset-0 grid-overlay opacity-50"></div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className={`particle absolute bg-vit-500/40 w-${[1, 2][i % 2] + 1} h-${[1, 2][i % 2] + 1}`} 
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * -8}s`,
                animationDuration: `${6 + Math.random() * 6}s`,
                opacity: 0.2 + Math.random() * 0.4,
                borderRadius: '50%'
              }}
            ></div>
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vit-900/60 border border-vit-500/30 text-vit-300 text-sm font-semibold mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            Student Marketplace — Buy, Sell & Trade
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight">
            The Smart Way<br />
            <span className="display-heading inline-block mt-1" style={{ fontSize: '0.92em', background: 'linear-gradient(135deg,#c4b5fd 0%,#22d3ee 45%,#fb7185 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              to Trade on Campus
            </span>
          </h1>
          <p className="mt-7 max-w-2xl mx-auto text-lg text-gray-300/80 leading-relaxed font-light">
            Buy pre-loved textbooks, sell old electronics, or trade items you no longer need — all within your verified campus community. <span className="text-vit-300 font-medium">No fees. No strangers. No shipping.</span>
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onClick={() => navigate('/buy')} className="btn-pulse px-8 py-4 bg-gradient-to-r from-vit-600 to-vit-700 text-white font-bold rounded-2xl shimmer-btn shadow-2xl shadow-vit-500/40 text-base">
              Browse Items →
            </button>
            <button onClick={() => navigate('/sell')} className="px-8 py-4 glass text-white font-bold rounded-2xl glow-btn text-base border border-vit-500/30">
              Start Selling
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button 
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))} 
              className="flex items-center gap-3 px-5 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full text-sm font-medium text-gray-500 dark:text-gray-400 transition-all group shadow-sm"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-vit-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              Quick Search
              <span className="flex items-center gap-1">
                <span className="kbd-hint bg-white dark:bg-[#1a1430] px-1.5 py-0.5 rounded shadow-sm text-xs border border-gray-200 dark:border-white/10">Ctrl</span>
                <span className="kbd-hint bg-white dark:bg-[#1a1430] px-1.5 py-0.5 rounded shadow-sm text-xs border border-gray-200 dark:border-white/10">K</span>
              </span>
            </button>
          </div>

          {/* Feature pills */}
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            {[
              { icon: '🎒', label: 'Students Only' },
              { icon: '⚡', label: 'List in 60s' },
              { icon: '🔄', label: 'Trade & Buy' },
              { icon: '🔒', label: 'Campus Safe' },
              { icon: '💰', label: 'Zero Fees' }
            ].map((feature, i) => (
              <div key={i} className="feature-pill text-white/80">
                <span>{feature.icon}</span>
                <span className="font-semibold text-xs tracking-wide">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 animate-bounce">
          <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </section>

      {/* TICKER */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(105deg,#0d0820 0%,#160a30 40%,#0a1830 100%)', borderTop: '1px solid rgba(139,92,246,0.12)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg,#0d0820 0%,transparent 100%)' }}></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg,#0d0820 0%,transparent 100%)' }}></div>
        <div className="py-3 overflow-hidden" style={{ maskImage: 'linear-gradient(90deg,transparent 0%,black 8%,black 92%,transparent 100%)' }}>
          <div className="ticker-content" style={{ animation: 'ticker 40s linear infinite' }}>
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-3 select-none" style={{ padding: '0 28px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(139,92,246,0.4)' }}>✦</span>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: item.accent ? '#a78bfa' : 'rgba(255,255,255,0.45)' }}>
                  {item.icon}&nbsp;{item.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Recommendations title="Picked For You" />

      {/* CATEGORIES */}
      <section className="py-24 fade-in-section relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-30 dark:opacity-10 pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <div className="section-eyebrow justify-center mb-4">Explore</div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">
              Shop by <span className="underline-gradient is-visible">Category</span>
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">From notes to gadgets — find exactly what you need.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'Books', icon: '📚', value: 'Books', color: 'from-amber-400/20 to-amber-600/10', border: 'rgba(245,158,11,0.25)' },
              { name: 'Electronics', icon: '💻', value: 'Electronics', color: 'from-blue-400/20 to-blue-600/10', border: 'rgba(59,130,246,0.25)' },
              { name: 'Furniture', icon: '🛋️', value: 'Furniture', color: 'from-orange-400/20 to-orange-600/10', border: 'rgba(249,115,22,0.25)' },
              { name: 'Clothing', icon: '👕', value: 'Clothing', color: 'from-pink-400/20 to-pink-600/10', border: 'rgba(236,72,153,0.25)' },
              { name: 'Stationery', icon: '✏️', value: 'Stationery', color: 'from-yellow-400/20 to-yellow-600/10', border: 'rgba(234,179,8,0.25)' },
              { name: 'Sports Gear', icon: '⚽', value: 'Sports Gear', color: 'from-green-400/20 to-green-600/10', border: 'rgba(34,197,94,0.25)' },
              { name: 'Services', icon: '🤝', value: 'Services', color: 'from-purple-400/20 to-purple-600/10', border: 'rgba(168,85,247,0.25)' },
              { name: 'Tickets', icon: '🎟️', value: 'Tickets', color: 'from-red-400/20 to-red-600/10', border: 'rgba(239,68,68,0.25)' },
              { name: 'Other', icon: '📦', value: 'Other', color: 'from-gray-400/20 to-gray-600/10', border: 'rgba(107,114,128,0.2)' },
              { name: 'All Items', icon: '🛍️', value: 'all', color: 'from-vit-400/20 to-cyan-600/10', border: 'rgba(139,92,246,0.25)' }
            ].map((c, i) => (
              <div key={i} onClick={() => navigate(`/buy`)} className="category-card glass p-5 rounded-2xl text-center cursor-pointer" style={{ borderColor: c.border, animationDelay: `${i * 40}ms` }}>
                <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${c.color}`} style={{ border: `1px solid ${c.border}` }}>
                  <span className="cat-icon">{c.icon}</span>
                </div>
                <h3 className="font-bold text-sm text-gray-800 dark:text-white tracking-tight">{c.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECENTLY ADDED */}
      <section className="py-24 relative fade-in-section">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 0% 50%, rgba(139,92,246,0.06), transparent 60%)' }}></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <div>
              <div className="section-eyebrow mb-3">Fresh Listings</div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">
                Recently <span className="grad-text-vp">Added</span>
              </h2>
            </div>
            <button onClick={() => navigate('/buy')} className="flex items-center gap-2 text-vit-600 dark:text-vit-400 font-bold text-sm hover:gap-3 transition-all group">
              View All
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <p className="text-gray-400 col-span-full">Loading items...</p>
            ) : recentProducts.length > 0 ? (
              recentProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="text-gray-400 text-center py-10 col-span-full">No items yet — be the first to list! 🚀</p>
            )}
          </div>
        </div>
      </section>

      {/* LOST & FOUND PREVIEW */}
      <section className="py-24 fade-in-section relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-20 dark:opacity-10 pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <div>
              <div className="section-eyebrow mb-3">Campus Board</div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">
                Lost & <span className="underline-gradient is-visible">Found</span>
              </h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">Help reunite your fellow students with their belongings.</p>
            </div>
            <button onClick={() => navigate('/noticeboard')} className="flex items-center gap-2 text-vit-600 dark:text-vit-400 font-bold text-sm hover:gap-3 transition-all">
              View All
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingLF ? (
              <p className="text-gray-400 text-center col-span-full py-8">Loading items...</p>
            ) : lfItems.length > 0 ? (
              lfItems.map(item => {
                const isLost = item.reportType === 'lost';
                return (
                  <div key={item.id} onClick={() => navigate('/lost-and-found')} className="glass rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-2 hover:shadow-xl group border border-vit-500/10 hover:border-vit-500/30">
                    <div className="relative">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-full text-white ${isLost ? 'bg-rose-500 shadow-md shadow-rose-500/30' : 'bg-emerald-500 shadow-md shadow-emerald-500/30'}`}>
                        {isLost ? 'LOST' : 'FOUND'}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{item.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        {isLost ? 'Last seen:' : 'Found at:'} <span className="text-gray-700 dark:text-gray-300 ml-1">{item.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-center col-span-full py-8">All clear — nothing lost, nothing found!</p>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 fade-in-section relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-40 dark:opacity-20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="section-eyebrow justify-center mb-4">Simple Process</div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">
              How <span className="grad-text-vp">ViTMART</span> Works
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Three effortless steps to your next campus deal.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent)' }}></div>
            {[
              { icon: '✍️', num: '01', title: 'Create Account', desc: 'Sign up with your student email in under 30 seconds. Instantly access the full marketplace.' },
              { icon: '🔍', num: '02', title: 'Browse or List', desc: 'Find what you need, or list items you want to sell — upload a photo, set a price, and go live.' },
              { icon: '🤝', num: '03', title: 'Connect & Exchange', desc: 'Meet fellow students on campus to safely hand off the item. That\'s it — deal done!' },
            ].map((s, i) => (
              <div key={i} className="hiw-card glass p-8 rounded-2xl text-center relative group" style={{ animationDelay: `${i * 120}ms` }}>
                <div className="absolute top-5 right-5 font-black text-6xl select-none pointer-events-none" style={{ color: 'rgba(139,92,246,0.07)', fontSize: '5rem', lineHeight: 1 }}>{s.num}</div>
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(6,182,212,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <span className="hiw-icon">{s.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{s.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 fade-in-section relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30 dark:opacity-10"></div>
        <div className="container mx-auto px-6 max-w-3xl relative z-10">
          <div className="text-center mb-14">
            <div className="section-eyebrow justify-center mb-4">Answers</div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">
              <span className="underline-gradient is-visible">Common Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'What is ViTMART?', a: 'ViTMART is a student-exclusive campus marketplace where you can buy, sell, and trade goods like textbooks, electronics, and furniture directly with fellow students — all on campus, no shipping needed.' },
              { q: 'How do I get paid when I sell?', a: 'All payments are handled directly between buyer and seller during your in-person campus meetup — cash, UPI, or whatever you both agree on. ViTMART facilitates the connection.' },
              { q: 'Is it safe to meet buyers or sellers?', a: 'Meet in well-lit, public places on campus — the library lobby, student union, or a busy cafeteria. Always let a friend know your meeting details for added safety.' }
            ].map((faq, i) => (
              <details key={i} className="faq-item group">
                <summary className="flex items-center justify-between p-5 pr-6 cursor-pointer list-none">
                  <span className="font-bold text-gray-900 dark:text-white text-base pr-4">{faq.q}</span>
                  <div className="faq-arrow w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <svg className="w-4 h-4 text-vit-600 dark:text-vit-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </summary>
                <div className="faq-body px-5 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-vit-100/50 dark:border-vit-900/30 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
