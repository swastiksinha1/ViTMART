const renderOrdersPage = (freshOrders) => {
  if (!freshOrders && orders.length === 0) {
    db.collection('orders').where('userId','==',currentUser.uid).get()
      .then(snap => {
        if (!snap.empty) {
          orders = snap.docs
            .map(d => ({id:d.id,...d.data()}))
            .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        }
        renderOrdersPage(orders);
      })
      .catch(() => renderOrdersPage(orders || []));
    return;
  }
  const c = document.getElementById('orders-tab');
  let html = `
    ${getBackButtonHTML()}
    <div class="flex justify-between items-center mb-8">
      <div><p class="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">History</p><h2 class="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">My Orders</h2></div>
      ${orders.length>0?`<button id="clear-order-history-btn" class="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 hover:-translate-y-0.5 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Clear</button>`:''}
    </div>`;
  if (orders.length===0) { html += `<div class="glass p-12 rounded-2xl text-center"><div class="text-6xl mb-4">🛍️</div><p class="text-gray-400 font-medium">No orders yet — time to shop!</p></div>`; }
  else {
    html += `<div class="space-y-5">${orders.map(order => {
      const date = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString('en-US',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Just now';
      // Collect unique sellers in this order for chat buttons
      const sellerMap = {};
      (order.items||[]).forEach(item => {
        const fp = products.find(p => p.id === item.productId);
        const sid = item.sellerId || fp?.sellerId;
        const sname = item.sellerName || fp?.sellerName;
        const sphoto = item.sellerPhotoURL || fp?.sellerPhotoURL;
        if (sid && sid !== currentUser.uid && !sellerMap[sid]) {
          sellerMap[sid] = { name: sname || 'Seller', photo: sphoto || '', productName: item.name, productImage: item.imageUrl };
        }
      });
      const chatButtons = Object.entries(sellerMap).map(([sid, info]) => {
        const chatId = `${order.id}_${sid}`;
        return `<button class="open-order-chat-btn flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
          style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:white;box-shadow:0 4px 16px rgba(139,92,246,0.35)"
          data-chat-id="${chatId}"
          data-seller-id="${sid}"
          data-seller-name="${esc(info.name)}"
          data-seller-photo="${esc(info.photo)}"
          data-product-name="${esc(info.productName)}"
          data-product-image="${esc(info.productImage)}">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          Chat with ${esc(info.name)}
        </button>`;
      }).join('');
      return `
        <div class="glass p-6 rounded-2xl shadow-lg">
          <div class="flex flex-col sm:flex-row justify-between items-start border-b border-gray-100 dark:border-white/10 pb-4 mb-4 gap-2">
            <div><p class="font-bold">Order Placed</p><p class="text-sm text-gray-400">${date}</p></div>
            <div class="text-right"><p class="font-bold text-lg grad-text-vp">₹${order.total.toFixed(0)}</p><p class="text-xs text-gray-400 font-mono">ID: ${order.id.slice(0,12)}...</p></div>
          </div>
          <div class="space-y-3">
            ${order.items.map(item => {
              const fp = products.find(p => p.id===item.productId);
              return `
              <div class="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" data-action="view-details" data-id="${item.productId}">
                <div class="flex items-center gap-3 flex-grow min-w-0">
                  <img src="${optimizeImage(item.imageUrl,120)}" class="w-14 h-14 object-cover rounded-xl flex-shrink-0" loading="lazy" decoding="async">
                  <div class="min-w-0"><p class="font-bold text-sm truncate">${esc(item.name)}</p><p class="text-xs text-gray-400 font-medium">₹${item.price.toFixed(0)}</p></div>
                </div>
              </div>`;
            }).join('')}
          </div>
          ${chatButtons ? `<div class="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex flex-wrap gap-3">${chatButtons}</div>` : ''}
        </div>`;
    }).join('')}</div>`;
  }
  c.innerHTML = html;
};

const handleClearOrderHistory = () => {
  if (!currentUser) return;
  showConfirmModal("Clear your entire order history? This cannot be undone.", async () => {
    try {
      const batch = db.batch();
      const snap = await db.collection('orders').where('userId','==',currentUser.uid).get();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      showMessage('Order history cleared.','success');
    } catch(e) { showMessage('Failed to clear history.','error'); }
  });
};

// --- My Listings ---
const renderMyListingsPage = () => {
  const c = document.getElementById('my-listings-tab');
  const mine = products.filter(p => p.sellerId===currentUser.uid);
  const avail = mine.filter(p => p.status==='available');
  const sold = mine.filter(p => p.status==='sold'||p.status==='traded'||p.status==='removed');
  let html = `
    ${getBackButtonHTML()}
    <div class="mb-8"><p class="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">Your Store</p><h2 class="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">My Listings</h2></div>`;
  if (mine.length===0) html += `<div class="glass p-12 rounded-2xl text-center"><div class="text-6xl mb-4">🏪</div><p class="text-gray-400 font-medium">No listings yet. Start selling something!</p></div>`;
  else html += `
    <div class="mb-10">
      <h3 class="text-xl font-bold font-syne mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <span class="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg text-white text-xs flex items-center justify-center font-bold">${avail.length}</span>
        Active Listings
      </h3>
      <div id="available-listings" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
    </div>
    <div>
      <h3 class="text-xl font-bold font-syne mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <span class="w-7 h-7 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg text-white text-xs flex items-center justify-center font-bold">${sold.length}</span>
        Sold & Traded
      </h3>
      <div id="sold-listings" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
    </div>`;
  c.innerHTML = html;
  const aC = document.getElementById('available-listings');
  if (aC) { if(avail.length>0) avail.forEach(p=>aC.appendChild(createProductCard(p))); else aC.innerHTML=`<p class="text-gray-400 col-span-full">No active listings.</p>`; }
  const sC = document.getElementById('sold-listings');
  if (sC) {
    if (sold.length > 0) {
      sold.forEach(p => {
        const card = createProductCard(p);
        // Add re-open button for 'removed' listings
        if (p.status === 'removed') {
          const reOpenBtn = document.createElement('button');
          reOpenBtn.className = 'reopen-listing-btn w-full mt-2 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 glass rounded-xl hover:-translate-y-0.5 transition-transform pointer-events-auto';
          reOpenBtn.dataset.id = p.id;
          reOpenBtn.innerHTML = '♻️ Re-open Listing';
          reOpenBtn.style.pointerEvents = 'auto';
          const cardBody = card.querySelector('.p-4.flex.flex-col');
          if (cardBody) cardBody.appendChild(reOpenBtn);
        }
        sC.appendChild(card);
      });
    } else {
      sC.innerHTML = `<p class="text-gray-400 col-span-full">No sold items yet.</p>`;
    }
  }
};

// --- Profile ---
