const renderBuyPage = () => {
  const c = document.getElementById('buy-tab');
  c.innerHTML = `${getBackButtonHTML()}
    <div class="flex items-end justify-between mb-6">
      <div><p class="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">Marketplace</p><h2 class="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">Available Items</h2></div>
    </div>
    ${filterControlsHTML()}
    <div id="product-list-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>`;
  filterAndRenderProducts(false);
  attachFilterListeners('buy-tab', false);
};

const renderTradePage = () => {
  const c = document.getElementById('trade-tab');
  c.innerHTML = `${getBackButtonHTML()}
    <div class="flex items-end justify-between mb-6">
      <div><p class="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">Barter Exchange</p><h2 class="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">Items for Trade</h2></div>
    </div>
    ${filterControlsHTML()}
    <div id="trade-product-list-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>`;
  filterAndRenderProducts(true);
  attachFilterListeners('trade-tab', true);
};

const attachFilterListeners = (tabId, tradeOnly) => {
  const c = document.getElementById(tabId);
  const debouncedFilter = debounce(() => filterAndRenderProducts(tradeOnly), 280);
  c.querySelector('#search-input').addEventListener('input', debouncedFilter);
  c.querySelector('#filter-category').addEventListener('change', () => filterAndRenderProducts(tradeOnly));
  c.querySelector('#filter-price').addEventListener('change', () => filterAndRenderProducts(tradeOnly));
  c.querySelector('#filter-sort').addEventListener('change', () => filterAndRenderProducts(tradeOnly));
  c.querySelector('#reset-filters').addEventListener('click', () => {
    c.querySelector('#search-input').value = '';
    c.querySelector('#filter-category').value = 'all';
    c.querySelector('#filter-price').value = 'all';
    c.querySelector('#filter-sort').value = 'newest';
    filterAndRenderProducts(tradeOnly);
  });
};

const filterAndRenderProducts = (tradeOnly=false) => {
  const tabId = tradeOnly ? 'trade-tab' : 'buy-tab';
  const search = document.querySelector(`#${tabId} #search-input`)?.value.toLowerCase()||'';
  const category = document.querySelector(`#${tabId} #filter-category`)?.value||'all';
  const price = document.querySelector(`#${tabId} #filter-price`)?.value||'all';
  const sort = document.querySelector(`#${tabId} #filter-sort`)?.value||'newest';
  let list = products.filter(p => p.status==='available');
  if (tradeOnly) list = list.filter(p => p.isTradeable);
  if (search) list = list.filter(p => p.name.toLowerCase().includes(search));
  if (category!=='all') list = list.filter(p => p.category===category);
  if (price!=='all') { const [mn,mx]=price.split('-').map(Number); list=list.filter(p=>p.price>=mn&&p.price<=mx); }
  if (sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if (sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else list.sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
  renderProductList(list, tradeOnly);
};

// Pagination state — separate counters for buy and trade tabs
const _pageState = { buy: 0, trade: 0 };
const ITEMS_PER_PAGE = 12;

const renderProductList = (list, tradeOnly = false) => {
  const cId = tradeOnly ? 'trade-product-list-container' : 'product-list-container';
  const c = document.getElementById(cId);
  if (!c) return;

  // Reset page counter whenever the full list is rendered fresh
  const pageKey = tradeOnly ? 'trade' : 'buy';
  _pageState[pageKey] = 0;

  c.innerHTML = '';

  // Remove any old load-more button
  document.getElementById(`load-more-${pageKey}`)?.remove();

  if (list.length === 0) {
    if (currentUser) {
      c.innerHTML = `<p class="text-gray-400 text-center py-12 col-span-full">${tradeOnly ? 'No items available for trade yet.' : 'No products match your search. 🤷'}</p>`;
    } else {
      for (let i = 0; i < 8; i++) c.appendChild(createProductSkeleton());
    }
    return;
  }

  // Render first page
  const firstSlice = list.slice(0, ITEMS_PER_PAGE);
  firstSlice.forEach(p => c.appendChild(createProductCard(p)));

  // Show Load More if more pages exist
  if (list.length > ITEMS_PER_PAGE) {
    const remaining = list.length - ITEMS_PER_PAGE;
    const btn = document.createElement('button');
    btn.id = `load-more-${pageKey}`;
    btn.className = 'col-span-full w-full py-3.5 mt-2 glass rounded-2xl font-bold text-vit-600 dark:text-vit-400 border border-vit-500/20 hover:border-vit-500/40 hover:-translate-y-0.5 transition-all duration-200 text-sm';
    btn.innerHTML = `Load More <span class="opacity-60">(${remaining} more)</span>`;
    btn.addEventListener('click', () => {
      _pageState[pageKey]++;
      const start = _pageState[pageKey] * ITEMS_PER_PAGE;
      const nextSlice = list.slice(start, start + ITEMS_PER_PAGE);
      nextSlice.forEach(p => c.appendChild(createProductCard(p)));
      const newRemaining = list.length - (start + ITEMS_PER_PAGE);
      if (newRemaining <= 0) {
        btn.remove();
      } else {
        btn.innerHTML = `Load More <span class="opacity-60">(${newRemaining} more)</span>`;
      }
    });
    // Append button after grid, not inside it
    c.parentElement.appendChild(btn);
  }
};

// Cache the product currently shown in the detail page
// so the price-offer click handler can always find it,
// even when it's not in the locally-filtered `products` array.
let _currentDetailProduct = null;

// --- Product Detail ---
const renderProductDetailPage = (product) => {
  _currentDetailProduct = product;
  const c = document.getElementById('product-detail-tab');
  if (!c) return;
  if (offersUnsubscribe) offersUnsubscribe();

  const isMyProduct = currentUser?.uid === product.sellerId;
  let actionHTML = '';
  if (product.status==='sold'||product.status==='traded'||product.status==='removed') {
    const col = product.status==='sold' ? 'from-rose-500 to-rose-600' : product.status==='traded' ? 'from-vit-500 to-vit-700' : 'from-gray-400 to-gray-500';
    const label = product.status==='sold' ? 'Item Sold' : product.status==='traded' ? 'Item Traded' : 'Listing Closed';
    actionHTML = `<button class="w-full py-3 bg-gradient-to-r ${col} text-white rounded-xl font-bold cursor-not-allowed opacity-75" disabled>${label}</button>`;
    if (product.status==='removed' && isMyProduct) {
      actionHTML += `<button class="reopen-listing-btn w-full py-2.5 mt-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform" data-id="${product.id}">♻️ Re-open This Listing</button>`;
    }
  } else if (!isMyProduct) {
    actionHTML = `<button class="add-to-cart-btn w-full py-3 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-vit-500/30 mb-3" data-id="${product.id}">Add to Cart</button>`;
    if (product.isTradeable) actionHTML += `<button class="make-trade-offer-btn w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-emerald-500/30 mb-3" data-product-id="${product.id}">Make Trade Offer 🔄</button>`;
    actionHTML += `<button class="open-price-offer-btn w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-amber-500/30 mb-3" data-id="${product.id}">🤝 Make a Price Offer</button>`;
  }

  const soldBadge = product.status==='sold' ? `<span class="badge-sold">SOLD</span>` : product.status==='traded' ? `<span class="badge-traded">TRADED</span>` : '';
  const tradeBadge = product.isTradeable ? `<div class="badge-tradeable">🔄 Tradeable</div>` : '';

  c.innerHTML = `
    <div class="container mx-auto p-4 sm:p-6">
      ${getBackButtonHTML()}
      <div class="glass rounded-2xl overflow-hidden shadow-2xl shadow-vit-500/10">
        <div class="grid md:grid-cols-2 gap-0">
          <div class="p-6 bg-gray-50 dark:bg-white/2 relative">
            ${soldBadge}${tradeBadge}
            <img src="${optimizeImage(product.imageUrl, 800) || 'https://placehold.co/800x600/e8e0ff/7c3aed?text=No+Image'}" alt="${esc(product.name)}" class="w-full h-[480px] object-contain rounded-xl ${product.status!=='available'?'grayscale opacity-60':''}" loading="lazy" decoding="async">
          </div>
          <div class="p-8 flex flex-col">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold px-3 py-1 bg-vit-100 dark:bg-vit-900/40 text-vit-700 dark:text-vit-300 rounded-full">${esc(product.category||'Other')}</span>
              ${product.isTradeable ? `<span class="text-xs font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">🔄 Tradeable</span>` : ''}
            </div>
            <h1 class="text-3xl lg:text-4xl font-black font-syne text-gray-900 dark:text-white mt-2 leading-tight">${esc(product.name)}</h1>
            <div class="mt-5 py-4 border-y border-gray-100 dark:border-white/10 flex items-center gap-3">
              <img src="${optimizeImage(product.sellerPhotoURL,88)||`https://placehold.co/44x44/e8e0ff/7c3aed?text=${getInitials(product.sellerName)}`}" class="w-11 h-11 rounded-xl object-cover" alt="${esc(product.sellerName)}" loading="lazy" decoding="async">
              <div><p class="text-xs text-gray-400">Listed by</p><p class="font-bold text-gray-900 dark:text-white">${esc(product.sellerName)}</p></div>
            </div>
            <p class="text-gray-600 dark:text-gray-300 mt-5 flex-grow leading-relaxed">${esc(product.description)}</p>
            <div class="mt-8">
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Price</p>
              <p class="text-5xl font-black font-syne grad-text-vp mb-5">₹${product.price.toFixed(0)}</p>
              ${actionHTML}
            </div>
          </div>
        </div>
      </div>
      ${isMyProduct && product.status==='available' ? `
        <div class="mt-4 flex gap-2 flex-wrap">
          <button class="open-edit-price-btn edit-price-btn" data-id="${product.id}">✏️ Edit Price</button>
        </div>` : ''}
      ${isMyProduct && product.isTradeable && product.status==='available' ? `<div id="offers-section" class="mt-8"></div>` : ''}
      ${isMyProduct && product.status==='available' ? `<div id="price-offers-section-detail" class="mt-4"></div>` : ''}
    </div>`;

  if (isMyProduct && product.isTradeable && product.status==='available') renderSellerOffersView(product.id);
  if (isMyProduct && product.status==='available') renderPriceOffersSection(product.id, 'price-offers-section-detail');
};

// --- Sell Page ---
