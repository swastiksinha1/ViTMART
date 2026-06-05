const REC = {
  // Action weights — how much each action boosts a category/keyword
  WEIGHTS: { view:1, wishlist:4, cart:6, buy:10, review:3, offer:5 },
  // Recency half-life in ms — interest halves every N days
  HALF_LIFE_MS: 3 * 24 * 60 * 60 * 1000,  // 3 days
  // How many items to return
  TOP_N: 8,
  STORAGE: {
    EVENTS: 'vm_rec_events',    // raw event log
    PROFILE: 'vm_rec_profile',  // computed affinity profile
  }
};

// ── Event logging ─────────────────────────────────────────
const recLog = (product, action) => {
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
  // Keep last 100 raw events
  localStorage.setItem(REC.STORAGE.EVENTS, JSON.stringify(events.slice(0, 100)));
  rebuildProfile();
};

// Legacy compatibility shims
const trackUserInterest = (label, action='view') => {};  // replaced by recLog
const trackBrowse = (product) => { if (product) recLog(product, 'view'); };

// ── Profile builder ───────────────────────────────────────
// Rebuilds the affinity profile from raw events with recency decay
const rebuildProfile = () => {
  const events = JSON.parse(localStorage.getItem(REC.STORAGE.EVENTS) || '[]');
  const now = Date.now();
  const profile = {
    categories: {},   // category → weighted score
    pricePoints: [],  // recent prices for price-range model
    keywords: {},     // token → weighted score
    seenIds: new Set(),
  };

  events.forEach(ev => {
    const age = now - ev.t;
    // Recency decay: score × 2^(-age / half_life)
    const decay = Math.pow(2, -age / REC.HALF_LIFE_MS);
    const w = (REC.WEIGHTS[ev.action] || 1) * decay;

    // Category affinity
    const cat = (ev.category || 'other').toLowerCase();
    profile.categories[cat] = (profile.categories[cat] || 0) + w;

    // Price range (use last 20 priced events)
    if (ev.price > 0 && profile.pricePoints.length < 20) {
      profile.pricePoints.push(ev.price);
    }

    // Keyword affinity — split name into tokens, weight each
    const tokens = (ev.name || '').toLowerCase()
      .replace(/[^a-z0-9ऀ-ॿ ]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);  // ignore 1-2 char words
    tokens.forEach(t => {
      profile.keywords[t] = (profile.keywords[t] || 0) + w * 0.5;
    });

    profile.seenIds.add(ev.id);
  });

  // Compute price range: mean ± 1 std-dev
  if (profile.pricePoints.length > 0) {
    const mean = profile.pricePoints.reduce((s, p) => s + p, 0) / profile.pricePoints.length;
    const variance = profile.pricePoints.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / profile.pricePoints.length;
    const std = Math.sqrt(variance);
    profile.priceMean = mean;
    profile.priceStd = std || mean * 0.5;  // fallback
  }

  profile.seenIds = [...profile.seenIds];  // serialize Set → Array
  localStorage.setItem(REC.STORAGE.PROFILE, JSON.stringify(profile));
};

// ── Scorer ────────────────────────────────────────────────
const scoreProduct = (product, profile, wishlist) => {
  const now = Date.now();
  let score = 0;
  const reasons = [];

  // 1. Category affinity (0–30 pts)
  const cat = (product.category || 'other').toLowerCase();
  const catScore = (profile.categories[cat] || 0) * 3;
  if (catScore > 0) {
    score += Math.min(catScore, 30);
    reasons.push({ label: cat, pts: Math.min(catScore, 30) });
  }

  // 2. Keyword affinity (0–20 pts)
  const tokens = (product.name || '').toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ ]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);
  let kwScore = 0;
  tokens.forEach(t => { kwScore += (profile.keywords[t] || 0); });
  if (kwScore > 0) {
    score += Math.min(kwScore * 2, 20);
    reasons.push({ label: 'keyword match', pts: Math.min(kwScore * 2, 20) });
  }

  // 3. Price range affinity (0–15 pts)
  if (profile.priceMean && product.price > 0) {
    const dist = Math.abs(product.price - profile.priceMean);
    const tolerance = profile.priceStd * 1.5;
    if (dist <= tolerance) {
      const pts = 15 * (1 - dist / tolerance);
      score += pts;
      reasons.push({ label: 'price match', pts: Math.round(pts) });
    }
  }

  // 4. Freshness bonus — items < 48h old get up to 10 pts
  const ageMs = now - (product.createdAt?.toMillis?.() || 0);
  if (ageMs < 48 * 3600000) {
    const freshPts = 10 * (1 - ageMs / (48 * 3600000));
    score += freshPts;
    reasons.push({ label: 'new listing', pts: Math.round(freshPts) });
  }

  // 5. Wishlist boost — if user already saved it
  if (wishlist.includes(product.id)) {
    score += 8;
    reasons.push({ label: 'in wishlist', pts: 8 });
  }

  // 6. Tradeable bonus — if user has engaged with trade section
  if (product.isTradeable && (profile.categories['trade'] || 0) > 0) {
    score += 3;
  }

  return { score, reasons };
};

// ── Main recommendation getter ────────────────────────────
const getRecommendations = (limit = REC.TOP_N) => {
  rebuildProfile();
  const profile = JSON.parse(localStorage.getItem(REC.STORAGE.PROFILE) || '{}');
  const seenIds = new Set(profile.seenIds || []);
  const wishlist = JSON.parse(localStorage.getItem('vitmart_wishlist') || '[]');

  const candidates = products.filter(p =>
    p.status === 'available' &&
    p.sellerId !== currentUser?.uid
  );

  if (candidates.length === 0) return [];

  // Score every candidate
  const scored = candidates.map(p => {
    const { score, reasons } = scoreProduct(p, profile, wishlist);
    // Slight penalty for already-seen items (still show them, just lower)
    const seenPenalty = seenIds.has(p.id) ? 0.6 : 1.0;
    return { ...p, recScore: score * seenPenalty, recReasons: reasons };
  }).sort((a, b) => b.recScore - a.recScore);

  // ── Diversity pass ──────────────────────────────────────
  // Ensure we don't show 6 items from the same category or seller.
  // Use a greedy fill: pick top item, then pick next best that adds diversity.
  const result = [];
  const catCount = {};
  const sellerCount = {};
  const MAX_PER_CAT = 2;
  const MAX_PER_SELLER = 2;

  // First pass: fill from top scored with diversity
  for (const p of scored) {
    if (result.length >= limit) break;
    const cat = p.category || 'Other';
    const seller = p.sellerId;
    if ((catCount[cat] || 0) >= MAX_PER_CAT) continue;
    if ((sellerCount[seller] || 0) >= MAX_PER_SELLER) continue;
    result.push(p);
    catCount[cat] = (catCount[cat] || 0) + 1;
    sellerCount[seller] = (sellerCount[seller] || 0) + 1;
  }

  // Second pass: fill remaining slots with best available (relax diversity)
  if (result.length < Math.min(limit, candidates.length)) {
    const resultIds = new Set(result.map(p => p.id));
    for (const p of scored) {
      if (result.length >= limit) break;
      if (!resultIds.has(p.id)) result.push(p);
    }
  }

  return result;
};

// ── Why recommended label ─────────────────────────────────
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

const renderRecommendationsSection = (containerId) => {
  const c = document.getElementById(containerId);
  if (!c || !currentUser) return;
  const recs = getRecommendations(8);
  if (recs.length === 0) { c.innerHTML=''; return; }

  c.innerHTML = `
    <div class="mt-12 mb-2 flex items-end justify-between">
      <div>
        <p class="section-eyebrow mb-2">Just For You</p>
        <h3 class="text-2xl font-black text-gray-900 dark:text-white">✨ Recommended <span class="grad-text-vp">For You</span></h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Personalised based on what you browse, wishlist & buy</p>
      </div>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-5">
      ${recs.map(p => {
        const reason = getRecReasonLabel(p);
        const isFresh = p.recReasons?.some(r => r.label === 'new listing');
        const isWishlisted = p.recReasons?.some(r => r.label === 'in wishlist');
        const badgeClass = isFresh ? 'background:linear-gradient(135deg,#10b981,#059669)' : isWishlisted ? 'background:linear-gradient(135deg,#f43f5e,#e11d48)' : 'background:linear-gradient(135deg,#7c3aed,#06b6d4)';
        return `
        <div class="rec-card group" data-action="view-details" data-id="${p.id}">
          <div style="position:relative;overflow:hidden">
            <img src="${optimizeImage(p.imageUrl,400)||'https://placehold.co/200x160/e8e0ff/7c3aed?text=?'}" alt="${esc(p.name)}" class="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async">
            <div style="position:absolute;top:8px;left:8px;${badgeClass};color:white;font-size:10px;font-weight:800;padding:3px 9px;border-radius:99px;letter-spacing:0.04em;white-space:nowrap;max-width:calc(100% - 16px);overflow:hidden;text-overflow:ellipsis">${reason}</div>
          </div>
          <div class="p-3">
            <p class="font-bold text-gray-900 dark:text-white text-sm truncate">${esc(p.name)}</p>
            <p class="text-xs text-gray-400 truncate mt-0.5">${esc(p.category||'Other')} · by ${esc(p.sellerName||'Student')}</p>
            <p class="font-black grad-text-vp text-base mt-2">₹${p.price?.toFixed(0)||'—'}</p>
          </div>
        </div>`;
      }).join('')}
    </div>`;
};

// Patch renderProductDetailPage to track browse
const _origRenderDetail = renderProductDetailPage;

// ══════════════════════════════════════════════
// PATCH: Track browse history & show recommendations
// ══════════════════════════════════════════════
const origRenderBuyPage = renderBuyPage;
// Add recommendations to buy page bottom via MutationObserver
const buyTabObs = new MutationObserver(() => {
  const recCont = document.getElementById('buy-rec-container');
  if (!recCont && document.getElementById('buy-tab')?.classList.contains('active')) {
    const buyTab = document.getElementById('buy-tab');
    const recDiv = document.createElement('div');
    recDiv.id = 'buy-rec-container';
    buyTab.appendChild(recDiv);
    renderRecommendationsSection('buy-rec-container');
  }
});
const buyTabEl = document.getElementById('buy-tab');
if (buyTabEl) buyTabObs.observe(buyTabEl, { attributes:true, attributeFilter:['class'] });

// Track when product detail is viewed
document.body.addEventListener('click', e => {
  const vdBtn = e.target.closest('[data-action="view-details"]');
  if (vdBtn) {
    const p = products.find(x=>x.id===vdBtn.dataset.id);
    if (p) trackBrowse(p);
  }
}, true);

// Track successful cart adds
const origAddToCart = addToCart;

// ══════════════════════════════════════════════
// MANAGE: Clear order history wired globally
// ══════════════════════════════════════════════
document.body.addEventListener('click', e => {
  if (e.target.closest('#clear-order-history-btn-manage')) {
    // handled inside renderManagePage
  }
  // Delete review
  const drBtn = e.target.closest('.delete-review-btn');
  if (drBtn) {
    showConfirmModal('Delete this review?', async () => {
      try { await db.collection('reviews').doc(drBtn.dataset.id).delete(); showMessage('Deleted.','success'); }
      catch(err) { showMessage('Error.','error'); }
    });
  }
});

// Cleanup reviews unsubscribe on tab change
const _origSetActiveTabFinal = setActiveTab;

// ══════════════════════════════════════════════
// ENHANCED: Add Reviews & Recommendations to Home
// ══════════════════════════════════════════════
// Inject "For You" recs on home tab after it renders
const homeTabEl = document.getElementById('home-tab');
const homeRecObs = new MutationObserver(() => {
  const recSection = document.getElementById('home-rec-section');
  if (!recSection && homeTabEl?.classList.contains('active') && currentUser) {
    const hist = JSON.parse(localStorage.getItem('vitmart_browse_history')||'[]');
    if (hist.length >= 1) {
      const recs = getRecommendations();
      if (recs.length > 0) {
        const div = document.createElement('section');
        div.id = 'home-rec-section';
        div.className = 'container mx-auto px-6 py-12';
        div.innerHTML = `
          <div class="mb-6">
            <p class="section-eyebrow mb-2">Personalised</p>
            <h3 class="text-3xl font-black text-gray-900 dark:text-white">✨ Picked for <span class="grad-text-vp">You</span></h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            ${recs.map(p=>`
              <div class="rec-card group" data-action="view-details" data-id="${p.id}" style="position:relative">
                <img src="${optimizeImage(p.imageUrl,300)||'https://placehold.co/200x160/e8e0ff/7c3aed?text=?'}" class="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async">
                <div class="p-3">
                  <p class="font-bold text-sm text-gray-900 dark:text-white truncate">${esc(p.name)}</p>
                  <p class="text-xs text-gray-400 truncate mt-0.5">${esc(p.category||'Other')}</p>
                  <p class="font-black grad-text-vp text-sm mt-1">₹${p.price?.toFixed(0)||'—'}</p>
                </div>
              </div>`).join('')}
          </div>`;
        // Insert before footer-like last section
        homeTabEl.appendChild(div);
      }
    }
  }
});
if (homeTabEl) homeRecObs.observe(homeTabEl, { attributes:true, subtree:false, attributeFilter:['class'] });


// ═══════════════════════════════════════════════════════════
// ░░░  NOTICEBOARD  ░░░
// ═══════════════════════════════════════════════════════════
