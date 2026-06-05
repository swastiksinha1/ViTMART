const renderManagePage = (freshOrders) => {
  if (!currentUser) { showMessage('Sign in to manage your data.','error'); setActiveTab('home'); return; }
  // If called without pre-fetched orders, do a fresh Firestore fetch first.
  // This ensures manage page always shows the latest purchases even if
  // the onSnapshot hasn't fired yet (e.g. immediately after checkout).
  if (!freshOrders) {
    db.collection('orders').where('userId','==',currentUser.uid).get()
      .then(snap => {
        const fetched = snap.docs
          .map(d => ({id:d.id,...d.data()}))
          .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        // Merge: take whichever is newer/longer
        if (fetched.length >= orders.length) orders = fetched;
        renderManagePage(orders); // recurse with fresh data
      })
      .catch(() => renderManagePage(orders || [])); // fallback on error
    return; // exit — will re-enter with fresh data
  }
  const c = document.getElementById('manage-tab');
  const myProducts = products.filter(p => p.sellerId === currentUser.uid);
  const soldProducts = myProducts.filter(p => p.status==='sold'||p.status==='traded');
  const activeProducts = myProducts.filter(p => p.status==='available');

  c.innerHTML = `
    ${getBackButtonHTML()}
    <div class="mb-8">
      <p class="section-eyebrow mb-2">Data Management</p>
      <h2 class="text-4xl font-black text-gray-900 dark:text-white">Manage & <span class="grad-text">Cleanup</span></h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Delete old listings, clear history, and keep your profile tidy</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">

      <!-- My Old Sold/Traded Listings -->
      <div class="manage-section">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 text-lg">📦</div>
          <div>
            <h3 class="font-black text-gray-900 dark:text-white">Old Listings</h3>
            <p class="text-xs text-gray-400">Sold & traded items you can remove</p>
          </div>
          <span class="ml-auto px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full">${soldProducts.length}</span>
        </div>
        ${soldProducts.length === 0
          ? `<p class="text-gray-400 text-sm text-center py-6">✅ No old listings to clean up</p>`
          : `<div id="sold-listings-list">
              ${soldProducts.map(p => `
                <div class="delete-item-row">
                  <input type="checkbox" class="sold-item-check styled-check" data-id="${p.id}">
                  <img src="${optimizeImage(p.imageUrl,80)||'https://placehold.co/40x40/e8e0ff/7c3aed?text=?'}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" decoding="async">
                  <div class="flex-grow min-w-0">
                    <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">${esc(p.name)}</p>
                    <p class="text-xs text-gray-400">₹${p.price} · <span class="${p.status==='sold'?'text-rose-500':'text-emerald-500'} font-bold">${p.status.toUpperCase()}</span></p>
                  </div>
                </div>`).join('')}
            </div>
            <div class="flex gap-3 mt-4">
              <button id="select-all-sold" class="flex-1 py-2 glass rounded-xl text-sm font-semibold hover:-translate-y-0.5 transition-transform">Select All</button>
              <button id="delete-selected-sold" class="flex-1 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 hover:-translate-y-0.5 transition-all shimmer-btn">Delete Selected 🗑️</button>
            </div>`}
      </div>

      <!-- Order History -->
      <div class="manage-section">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 text-lg">🧾</div>
          <div>
            <h3 class="font-black text-gray-900 dark:text-white">Order History</h3>
            <p class="text-xs text-gray-400">Your past purchases</p>
          </div>
          <span class="ml-auto px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full">${orders.length}</span>
        </div>
        ${orders.length === 0
          ? `<p class="text-gray-400 text-sm text-center py-6">✅ No order history</p>`
          : `<div class="space-y-2 max-h-60 overflow-y-auto mb-4">
              ${orders.slice(0,5).map(o=>`
                <div class="delete-item-row">
                  <span class="text-lg">📋</span>
                  <div class="flex-grow min-w-0">
                    <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">Order #${o.id.slice(-6).toUpperCase()}</p>
                    <p class="text-xs text-gray-400">₹${o.total?.toFixed(0)||'—'} · ${o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>`).join('')}
              ${orders.length>5 ? `<p class="text-center text-xs text-gray-400">+${orders.length-5} more orders</p>` : ''}
            </div>
            <button id="clear-order-history-btn-manage" class="w-full py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 hover:-translate-y-0.5 transition-all shimmer-btn">Clear All Order History 🗑️</button>`}
      </div>

      <!-- Wishlist Manager -->
      <div class="manage-section">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500 text-lg">❤️</div>
          <div>
            <h3 class="font-black text-gray-900 dark:text-white">Wishlist</h3>
            <p class="text-xs text-gray-400">Items you've saved</p>
          </div>
        </div>
        <div id="wishlist-manager-content"></div>
        <button id="clear-wishlist-btn" class="mt-4 w-full py-2.5 glass rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">Clear Entire Wishlist</button>
      </div>

      <!-- Browse History / Preferences -->
      <div class="manage-section">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-vit-100 dark:bg-vit-900/30 flex items-center justify-center text-vit-500 text-lg">🔍</div>
          <div>
            <h3 class="font-black text-gray-900 dark:text-white">Browse History</h3>
            <p class="text-xs text-gray-400">Your recent views & interests</p>
          </div>
        </div>
        <div id="browse-history-content"></div>
        <button id="clear-history-btn" class="mt-4 w-full py-2.5 glass rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">Clear Browse History</button>
      </div>

    </div>

    <!-- Danger Zone -->
    <div class="manage-section danger-zone mt-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 text-lg">⚠️</div>
        <div>
          <h3 class="font-black text-rose-600 dark:text-rose-400">Danger Zone</h3>
          <p class="text-xs text-gray-400">Irreversible actions — proceed with caution</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-3">
        <button id="delete-all-listings-btn" class="px-5 py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-xl text-sm font-bold hover:bg-rose-500 hover:text-white hover:-translate-y-0.5 transition-all">🗑️ Delete All My Listings</button>
        <button id="clear-all-data-btn" class="px-5 py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-xl text-sm font-bold hover:bg-rose-500 hover:text-white hover:-translate-y-0.5 transition-all">💣 Clear All Local Data</button>
      </div>
    </div>`;

  // Populate wishlist
  const wl = JSON.parse(localStorage.getItem('vitmart_wishlist')||'[]');
  const wlContent = c.querySelector('#wishlist-manager-content');
  const wlItems = products.filter(p => wl.includes(p.id));
  wlContent.innerHTML = wlItems.length === 0
    ? `<p class="text-gray-400 text-sm text-center py-4">No saved items</p>`
    : wlItems.slice(0,4).map(p=>`<div class="delete-item-row">
        <img src="${optimizeImage(p.imageUrl,80)||'https://placehold.co/40x40/e8e0ff/7c3aed?text=?'}" class="w-10 h-10 rounded-lg object-cover" loading="lazy" decoding="async">
        <div class="flex-grow min-w-0"><p class="font-semibold text-sm truncate text-gray-900 dark:text-white">${esc(p.name)}</p><p class="text-xs text-gray-400">₹${p.price}</p></div>
        <button class="remove-wl-btn text-gray-300 hover:text-rose-500 transition-colors p-1 rounded-lg" data-id="${p.id}">✕</button>
      </div>`).join('')
      + (wlItems.length>4 ? `<p class="text-center text-xs text-gray-400 mt-2">+${wlItems.length-4} more</p>` : '');

  // Populate browse history
  const hist = JSON.parse(localStorage.getItem('vitmart_browse_history')||'[]');
  const histContent = c.querySelector('#browse-history-content');
  histContent.innerHTML = hist.length === 0
    ? `<p class="text-gray-400 text-sm text-center py-4">No browse history</p>`
    : hist.slice(0,5).map(h=>`<div class="delete-item-row">
        <span class="text-lg">👁️</span>
        <div class="flex-grow min-w-0"><p class="font-semibold text-sm truncate text-gray-900 dark:text-white">${h.name}</p><p class="text-xs text-gray-400">${timeAgoStr(new Date(h.time))}</p></div>
      </div>`).join('');

  // Select all sold items
  c.querySelector('#select-all-sold')?.addEventListener('click', () => {
    c.querySelectorAll('.sold-item-check').forEach(cb => cb.checked = !cb.checked);
  });

  // Delete selected sold
  c.querySelector('#delete-selected-sold')?.addEventListener('click', () => {
    const selected = [...c.querySelectorAll('.sold-item-check:checked')].map(cb=>cb.dataset.id);
    if (selected.length === 0) { showMessage('Select at least one item to delete.','error'); return; }
    showConfirmModal(`Delete ${selected.length} listing(s)? This cannot be undone.`, async () => {
      const batch = db.batch();
      selected.forEach(id => batch.delete(db.collection('products').doc(id)));
      try { await batch.commit(); showMessage(`Deleted ${selected.length} listing(s).`,'success'); renderManagePage(); }
      catch(e) { showMessage('Error: '+e.message,'error'); }
    });
  });

  // Clear order history
  c.querySelector('#clear-order-history-btn-manage')?.addEventListener('click', () => {
    showConfirmModal('Clear all order history? This is permanent.', async () => {
      const batch = db.batch();
      orders.forEach(o => batch.delete(db.collection('orders').doc(o.id)));
      try { await batch.commit(); orders=[]; showMessage('Order history cleared.','success'); renderManagePage(); }
      catch(e) { showMessage('Error: '+e.message,'error'); }
    });
  });

  // Wishlist remove
  c.querySelectorAll('.remove-wl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleWishlist(btn.dataset.id);
      renderManagePage();
    });
  });

  // Clear wishlist
  c.querySelector('#clear-wishlist-btn')?.addEventListener('click', () => {
    showConfirmModal('Clear your entire wishlist?', () => {
      localStorage.removeItem('vitmart_wishlist');
      document.querySelectorAll('.wishlist-btn').forEach(b => b.classList.remove('wishlisted'));
      showMessage('Wishlist cleared.','success');
      renderManagePage();
    });
  });

  // Clear browse history
  c.querySelector('#clear-history-btn')?.addEventListener('click', () => {
    showConfirmModal('Clear browse history?', () => {
      localStorage.removeItem('vitmart_browse_history');
      localStorage.removeItem('vitmart_interests');
      showMessage('Browse history cleared.','success');
      renderManagePage();
    });
  });

  // Delete all listings
  c.querySelector('#delete-all-listings-btn')?.addEventListener('click', () => {
    if (myProducts.length === 0) { showMessage('You have no listings to delete.','error'); return; }
    showConfirmModal(`Delete ALL ${myProducts.length} of your listings? This cannot be undone!`, async () => {
      const batch = db.batch();
      myProducts.forEach(p => batch.delete(db.collection('products').doc(p.id)));
      try { await batch.commit(); showMessage('All listings deleted.','success'); renderManagePage(); }
      catch(e) { showMessage('Error: '+e.message,'error'); }
    });
  });

  // Clear all local data
  c.querySelector('#clear-all-data-btn')?.addEventListener('click', () => {
    showConfirmModal('Clear ALL local data (wishlist, history, preferences)? Cannot be undone.', () => {
      const keys = ['vitmart_wishlist','vitmart_browse_history','vitmart_interests','theme'];
      keys.forEach(k => localStorage.removeItem(k));
      showMessage('All local data cleared.','success');
      renderManagePage();
    });
  });
};

// ══════════════════════════════════════════════
// NEW FEATURE: RECOMMENDATION SYSTEM
// ══════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// ░░░  RECOMMENDATION ENGINE v2  ░░░
//
//  Signals used (with weights):
//    1. Category affinity       — built from views, cart adds, purchases
//    2. Price range affinity    — learned from viewing/buying history
//    3. Keyword affinity        — token overlap between interests & product name
//    4. Recency decay           — recent interactions count more than old ones
//    5. Freshness bonus         — brand-new listings get a boost
//    6. Popularity proxy        — items wishlisted by the user get a boost
//    7. Diversity injection     — ensures multiple categories appear
//    8. Seller diversity        — avoids showing only one seller's items
// ═══════════════════════════════════════════════════════════
