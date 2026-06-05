import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';
import { useNavigate } from 'react-router-dom';

const REC = {
  WEIGHTS: { view: 1, wishlist: 4, cart: 6, buy: 10, review: 3, offer: 5 },
  HALF_LIFE_MS: 3 * 24 * 60 * 60 * 1000,
  TOP_N: 8,
  STORAGE: {
    EVENTS: 'vm_rec_events',
    PROFILE: 'vm_rec_profile',
  }
};

export const recLog = (product, action) => {
  if (!product) return;
  const events = JSON.parse(localStorage.getItem(REC.STORAGE.EVENTS) || '[]');
  events.unshift({
    id: product.id,
    name: product.name,
    category: product.category || 'Other',
    price: product.price || 0,
    imageUrl: product.imageUrl || '',
    action,
    t: Date.now()
  });
  localStorage.setItem(REC.STORAGE.EVENTS, JSON.stringify(events.slice(0, 100)));
  rebuildProfile();
};

const rebuildProfile = () => {
  const events = JSON.parse(localStorage.getItem(REC.STORAGE.EVENTS) || '[]');
  const now = Date.now();
  const profile = {
    categories: {},
    pricePoints: [],
    keywords: {},
    seenIds: new Set(),
  };

  events.forEach(ev => {
    const age = now - ev.t;
    const decay = Math.pow(2, -age / REC.HALF_LIFE_MS);
    const w = (REC.WEIGHTS[ev.action] || 1) * decay;

    const cat = (ev.category || 'other').toLowerCase();
    profile.categories[cat] = (profile.categories[cat] || 0) + w;

    if (ev.price > 0 && profile.pricePoints.length < 20) {
      profile.pricePoints.push(ev.price);
    }

    const tokens = (ev.name || '').toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);
    tokens.forEach(t => {
      profile.keywords[t] = (profile.keywords[t] || 0) + w * 0.5;
    });

    profile.seenIds.add(ev.id);
  });

  if (profile.pricePoints.length > 0) {
    const mean = profile.pricePoints.reduce((s, p) => s + p, 0) / profile.pricePoints.length;
    const variance = profile.pricePoints.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / profile.pricePoints.length;
    const std = Math.sqrt(variance);
    profile.priceMean = mean;
    profile.priceStd = std || mean * 0.5;
  }

  profile.seenIds = [...profile.seenIds];
  localStorage.setItem(REC.STORAGE.PROFILE, JSON.stringify(profile));
};

const scoreProduct = (product, profile, wishlist) => {
  const now = Date.now();
  let score = 0;
  const reasons = [];

  const cat = (product.category || 'other').toLowerCase();
  const catScore = (profile.categories[cat] || 0) * 3;
  if (catScore > 0) {
    score += Math.min(catScore, 30);
    reasons.push({ label: cat, pts: Math.min(catScore, 30) });
  }

  const tokens = (product.name || '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);
  let kwScore = 0;
  tokens.forEach(t => { kwScore += (profile.keywords[t] || 0); });
  if (kwScore > 0) {
    score += Math.min(kwScore * 2, 20);
    reasons.push({ label: 'keyword match', pts: Math.min(kwScore * 2, 20) });
  }

  if (profile.priceMean && product.price > 0) {
    const dist = Math.abs(product.price - profile.priceMean);
    const tolerance = profile.priceStd * 1.5;
    if (dist <= tolerance) {
      const pts = 15 * (1 - dist / tolerance);
      score += pts;
      reasons.push({ label: 'price match', pts: Math.round(pts) });
    }
  }

  const ageMs = now - (product.createdAt?.toMillis?.() || 0);
  if (ageMs < 48 * 3600000) {
    const freshPts = 10 * (1 - ageMs / (48 * 3600000));
    score += freshPts;
    reasons.push({ label: 'new listing', pts: Math.round(freshPts) });
  }

  if (wishlist.includes(product.id)) {
    score += 8;
    reasons.push({ label: 'in wishlist', pts: 8 });
  }

  if (product.isTradeable && (profile.categories['trade'] || 0) > 0) {
    score += 3;
  }

  return { score, reasons };
};

const getRecReasonLabel = (product) => {
  if (!product.recReasons || product.recReasons.length === 0) return 'New';
  const top = product.recReasons.sort((a, b) => b.pts - a.pts)[0];
  const labels = {
    'new listing': '🆕 Just listed',
    'in wishlist': '❤️ Saved',
    'keyword match': '🔍 Matches interests',
    'price match': '💰 In your range',
    'books': '📚 You like Books',
    'electronics': '💻 You browse Electronics',
    'furniture': '🪑 You like Furniture',
    'clothing': '👗 You like Clothing',
    'stationery': '✏️ You like Stationery',
    'sports gear': '⚽ You like Sports Gear',
    'services': '🛠️ You like Services',
    'other': '✨ Recommended',
  };
  return labels[top.label] || `🔁 Based on ${top.label}`;
};

export default function Recommendations({ limit = 8, title = "Recommended For You", subtitle = "Personalised based on what you browse, wishlist & buy" }) {
  const { products } = useProducts();
  const { currentUser } = useAuth();
  const [recs, setRecs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!products.length || !currentUser) return;
    
    rebuildProfile();
    const profile = JSON.parse(localStorage.getItem(REC.STORAGE.PROFILE) || '{}');
    const seenIds = new Set(profile.seenIds || []);
    const wishlist = JSON.parse(localStorage.getItem('vitmart_wishlist') || '[]');

    const candidates = products.filter(p => p.status === 'available' && p.sellerId !== currentUser.uid);
    if (candidates.length === 0) return;

    const scored = candidates.map(p => {
      const { score, reasons } = scoreProduct(p, profile, wishlist);
      const seenPenalty = seenIds.has(p.id) ? 0.6 : 1.0;
      return { ...p, recScore: score * seenPenalty, recReasons: reasons };
    }).sort((a, b) => b.recScore - a.recScore);

    const result = [];
    const catCount = {};
    const sellerCount = {};
    
    for (const p of scored) {
      if (result.length >= limit) break;
      const cat = p.category || 'Other';
      const seller = p.sellerId;
      if ((catCount[cat] || 0) >= 2) continue;
      if ((sellerCount[seller] || 0) >= 2) continue;
      result.push(p);
      catCount[cat] = (catCount[cat] || 0) + 1;
      sellerCount[seller] = (sellerCount[seller] || 0) + 1;
    }

    if (result.length < Math.min(limit, candidates.length)) {
      const resultIds = new Set(result.map(p => p.id));
      for (const p of scored) {
        if (result.length >= limit) break;
        if (!resultIds.has(p.id)) result.push(p);
      }
    }

    setRecs(result);
  }, [products, currentUser, limit]);

  if (!currentUser || recs.length === 0) return null;

  return (
    <div className="mt-12 mb-8">
      <div className="mb-6">
        <p className="section-eyebrow mb-2">Just For You</p>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white">✨ {title.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-vit-600 to-cyan-500">{title.substring(title.indexOf(' ') + 1)}</span></h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {recs.map(p => {
          const reason = getRecReasonLabel(p);
          const isFresh = p.recReasons?.some(r => r.label === 'new listing');
          const isWishlisted = p.recReasons?.some(r => r.label === 'in wishlist');
          const badgeClass = isFresh ? 'from-emerald-500 to-emerald-600' : isWishlisted ? 'from-rose-500 to-rose-600' : 'from-vit-600 to-cyan-500';

          return (
            <div 
              key={p.id} 
              onClick={() => navigate(`/buy?id=${p.id}`)}
              className="rec-card group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-xl">
                <img 
                  src={p.imageUrl || 'https://placehold.co/200x160/e8e0ff/7c3aed?text=?'} 
                  alt={p.name} 
                  className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className={`absolute top-2 left-2 bg-gradient-to-r ${badgeClass} text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap max-w-[calc(100%-16px)] truncate shadow-sm`}>
                  {reason}
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{p.category || 'Other'} · by {p.sellerName || 'Student'}</p>
                <p className="font-black text-transparent bg-clip-text bg-gradient-to-r from-vit-600 to-cyan-500 text-base mt-2">₹{p.price?.toFixed(0) || '—'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
