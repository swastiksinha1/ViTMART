const renderPriceOfferModal = (product) => {
  const modal = document.getElementById('price-offer-modal');
  const content = document.getElementById('price-offer-modal-content');
  content.innerHTML = `
    <div class="text-center mb-5">
      <div class="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">🤝</div>
      <h2 class="text-2xl font-black text-gray-900 dark:text-white">Make an Offer</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Seller's price: <span class="font-black grad-text-vp text-lg">₹${product.price.toFixed(0)}</span></p>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Your Offer (₹)</label>
        <input type="number" id="offer-price-input" class="vit-input text-xl font-black" placeholder="Enter your price" min="1" max="${product.price * 2}">
        <p class="text-xs text-gray-400 mt-1">Suggest a fair price — seller can accept, counter, or decline</p>
      </div>
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Message (optional)</label>
        <textarea id="offer-message-input" class="vit-input resize-none text-sm" rows="2" placeholder="e.g. 'Can you do ₹800? I'll pick up today.'"></textarea>
      </div>
      <div class="flex gap-3 pt-2">
        <button id="cancel-price-offer-btn" class="flex-1 py-2.5 glass rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform">Cancel</button>
        <button id="submit-price-offer-btn" class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-amber-500/30">Send Offer 🤝</button>
      </div>
    </div>`;
  modal.classList.add('show');

  content.querySelector('#cancel-price-offer-btn').onclick = () => modal.classList.remove('show');
  content.querySelector('#submit-price-offer-btn').onclick = async () => {
    const offerPrice = parseFloat(content.querySelector('#offer-price-input').value);
    const msg = content.querySelector('#offer-message-input').value.trim();
    if (!offerPrice || offerPrice <= 0) { showMessage('Enter a valid offer price.','error'); return; }
    const btn = content.querySelector('#submit-price-offer-btn');
    btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
    try {
      await db.collection('products').doc(product.id).collection('price_offers').add({
        offerPrice, message: filterProfanity(msg),
        buyerId: currentUser.uid, buyerName: currentUser.displayName||'Buyer',
        buyerPhoto: currentUser.photoURL||null, buyerEmail: currentUser.email,
        originalPrice: product.price, status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Notify the seller directly here (most reliable approach)
      if (product.sellerId && product.sellerId !== currentUser.uid) {
        sendNotification(product.sellerId, {
          type: 'price_offer',
          title: '💰 New Price Offer!',
          body: `${currentUser.displayName || 'Someone'} offered ₹${offerPrice} for "${product.name}".`,
          productId: product.id
        });
      }
      showMessage('Offer sent! The seller will see your offer on their listing.','success');
      modal.classList.remove('show');
    } catch(err) { showMessage('Error: '+err.message,'error'); }
    finally { btn.disabled=false; btn.innerHTML='Send Offer 🤝'; }
  };
};

// show price offers to seller on product detail
const renderPriceOffersSection = (productId, containerId) => {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = `<div class="glass p-6 rounded-2xl mt-6">
    <h3 class="text-lg font-black text-gray-900 dark:text-white mb-1">💰 Price Offers Received</h3>
    <p class="text-xs text-gray-400 mb-4">Accept, decline, or send a counter-price. Counter offers go to the buyer only — your listing price stays unchanged.</p>
    <div id="price-offers-list" class="space-y-3"><p class="text-gray-400 text-sm">Loading…</p></div>
  </div>`;
  const list = document.getElementById('price-offers-list');
  db.collection('products').doc(productId).collection('price_offers')
    .orderBy('createdAt','desc').limit(20).onSnapshot(snap => {
      if (snap.empty) { list.innerHTML=`<p class="text-gray-400 text-sm">No price offers yet.</p>`; return; }
      list.innerHTML = snap.docs.map(d => {
        const o = {id:d.id,...d.data()};
        const initials = (o.buyerName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
        const av = o.buyerPhoto
          ? `<img src="${o.buyerPhoto}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0">`
          : `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-vit-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">${initials}</div>`;

        // Status badge
        const statusBadge = o.status === 'accepted'
          ? `<span class="offer-status-accepted">✅ Accepted</span>`
          : o.status === 'rejected'
          ? `<span class="offer-status-rejected">❌ Declined</span>`
          : o.status === 'countered'
          ? `<span style="color:#8b5cf6;font-weight:700;font-size:11px">💬 Counter Sent</span>`
          : `<span class="offer-status-pending">⏳ Pending</span>`;

        // Counter price display (only shown when a counter was sent)
        const counterInfo = o.counterPrice
          ? `<p class="text-xs mt-1" style="color:#8b5cf6;font-weight:600">Your counter: ₹${o.counterPrice}</p>`
          : '';

        // Action buttons — only on pending offers
        const actions = o.status === 'pending' ? `
          <div class="flex gap-1.5 mt-2 flex-wrap justify-end">
            <button class="reject-price-offer-btn px-2.5 py-1 text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg font-bold hover:-translate-y-0.5 transition-transform"
              data-id="${d.id}" data-product-id="${productId}" title="Decline">✕ Decline</button>
            <button class="counter-price-offer-btn px-2.5 py-1 text-xs bg-vit-100 dark:bg-vit-900/30 text-vit-600 dark:text-vit-400 rounded-lg font-bold hover:-translate-y-0.5 transition-transform"
              data-id="${d.id}" data-product-id="${productId}" data-buyer-offer="${o.offerPrice}" title="Send counter offer">💬 Counter</button>
            <button class="accept-price-offer-btn px-2.5 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold hover:-translate-y-0.5 transition-transform"
              data-id="${d.id}" data-product-id="${productId}"
              data-buyer-id="${o.buyerId}" data-buyer-name="${o.buyerName}"
              data-buyer-photo="${o.buyerPhoto||''}" data-offer-price="${o.offerPrice}" title="Accept offer">✓ Accept</button>
          </div>` : '';

        return `<div class="price-offer-item">
          ${av}
          <div class="flex-grow min-w-0">
            <p class="font-bold text-sm text-gray-900 dark:text-white">${o.buyerName}</p>
            <p class="text-xs text-gray-400 mt-0.5">${o.message || '(no message)'}</p>
            ${counterInfo}
          </div>
          <div class="text-right flex-shrink-0">
            <p class="font-black text-lg grad-text-vp">₹${o.offerPrice}</p>
            ${statusBadge}
            ${actions}
          </div>
        </div>`;
      }).join('');

      // ── Accept ───────────────────────────────────────────────────────────
      list.querySelectorAll('.accept-price-offer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          showConfirmModal(`Accept ₹${btn.dataset.offerPrice} from ${btn.dataset.buyerName}? Item will stay at its listed price — this just confirms the deal.`, async () => {
            try {
              const batch = db.batch();
              batch.update(
                db.collection('products').doc(btn.dataset.productId).collection('price_offers').doc(btn.dataset.id),
                { status: 'accepted' }
              );
              // auto-reject other pending offers on the same product
              const others = await db.collection('products').doc(btn.dataset.productId)
                .collection('price_offers').where('status','==','pending').get();
              others.docs.forEach(d2 => { if (d2.id !== btn.dataset.id) batch.update(d2.ref, {status:'rejected'}); });
              await batch.commit();
              showMessage('Offer accepted! Contact the buyer via email to finalise.', 'success');
            } catch(err) { showMessage('Error: '+err.message, 'error'); }
          });
        });
      });

      // ── Decline ──────────────────────────────────────────────────────────
      list.querySelectorAll('.reject-price-offer-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await db.collection('products').doc(btn.dataset.productId)
              .collection('price_offers').doc(btn.dataset.id)
              .update({ status: 'rejected' });
            showMessage('Offer declined.', 'success');
          } catch(err) { showMessage('Error: '+err.message, 'error'); }
        });
      });

      // ── Counter ──────────────────────────────────────────────────────────
      // IMPORTANT: counter offer only writes to the offer document.
      // It NEVER touches the product's price field — the listing price is unchanged.
      list.querySelectorAll('.counter-price-offer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const buyerOffer = parseFloat(btn.dataset.buyerOffer);

          // Build counter modal inside price-offer-modal
          const modal = document.getElementById('price-offer-modal');
          const modalContent = document.getElementById('price-offer-modal-content');
          modalContent.innerHTML = `
            <div class="text-center mb-5">
              <div class="w-14 h-14 bg-gradient-to-br from-vit-500 to-vit-700 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">💬</div>
              <h2 class="text-2xl font-black text-gray-900 dark:text-white">Send Counter Offer</h2>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Buyer offered: <span class="font-black text-rose-500 text-lg">₹${buyerOffer.toFixed(0)}</span></p>
              <p class="text-xs text-gray-400 mt-1">⚠️ Your counter price is sent to the buyer only.<br>Your <strong>listing price stays exactly the same</strong>.</p>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Your Counter Price (₹)</label>
                <input type="number" id="counter-price-input" class="vit-input text-xl font-black" placeholder="e.g. 850" min="1">
                <div id="counter-preview" class="hidden mt-2 p-3 rounded-xl bg-vit-50 dark:bg-vit-900/20 text-center">
                  <p class="text-xs text-gray-500">Counter offer</p>
                  <p id="counter-preview-text" class="font-black text-lg grad-text-vp"></p>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Message (optional)</label>
                <textarea id="counter-message-input" class="vit-input resize-none text-sm" rows="2" placeholder="e.g. 'Best I can do is ₹850, pick up from hostel'"></textarea>
              </div>
              <div class="flex gap-3 pt-2">
                <button id="cancel-counter-btn" class="flex-1 py-2.5 glass rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform">Cancel</button>
                <button id="send-counter-btn" class="flex-1 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">Send Counter 💬</button>
              </div>
            </div>`;
          modal.classList.add('show');

          // Live preview
          const counterInp = modalContent.querySelector('#counter-price-input');
          const preview = modalContent.querySelector('#counter-preview');
          const previewText = modalContent.querySelector('#counter-preview-text');
          counterInp.addEventListener('input', () => {
            const v = parseFloat(counterInp.value);
            if (v > 0) {
              preview.classList.remove('hidden');
              const diff = v - buyerOffer;
              previewText.textContent = `₹${buyerOffer} → ₹${v}  (${diff > 0 ? '+' : ''}${((diff/buyerOffer)*100).toFixed(0)}%)`;
            } else {
              preview.classList.add('hidden');
            }
          });

          modalContent.querySelector('#cancel-counter-btn').onclick = () => modal.classList.remove('show');

          modalContent.querySelector('#send-counter-btn').onclick = async () => {
            const counterPrice = parseFloat(counterInp.value);
            const counterMsg = filterProfanity(modalContent.querySelector('#counter-message-input').value.trim());
            if (!counterPrice || counterPrice <= 0) { showMessage('Enter a valid counter price.', 'error'); return; }
            const sendBtn = modalContent.querySelector('#send-counter-btn');
            sendBtn.disabled = true;
            sendBtn.innerHTML = `<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
            try {
              // Write ONLY to the offer document — product price is never touched
              await db.collection('products').doc(btn.dataset.productId)
                .collection('price_offers').doc(btn.dataset.id)
                .update({
                  status: 'countered',
                  counterPrice,
                  counterMessage: counterMsg,
                  counteredAt: firebase.firestore.FieldValue.serverTimestamp()
                });
              modal.classList.remove('show');
              showMessage(`Counter of ₹${counterPrice} sent to buyer! Your listing price is unchanged.`, 'success');
            } catch(err) { showMessage('Error: '+err.message, 'error'); }
            finally { sendBtn.disabled = false; sendBtn.innerHTML = 'Send Counter 💬'; }
          };
        });
      });
    });
};

// ═══════════════════════════════════════════════════════════
// ░░░  EDIT PRICE (Seller)  ░░░
// ═══════════════════════════════════════════════════════════
const renderEditPriceModal = (product) => {
  const modal = document.getElementById('edit-price-modal');
  const content = document.getElementById('edit-price-modal-content');
  content.innerHTML = `
    <div class="text-center mb-5">
      <div class="w-14 h-14 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">✏️</div>
      <h2 class="text-2xl font-black text-gray-900 dark:text-white">Update Price</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">${product.name}</p>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Current Price</label>
        <p class="text-3xl font-black grad-text-vp mb-3">₹${product.price.toFixed(0)}</p>
        <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">New Price (₹)</label>
        <input type="number" id="new-price-input" class="vit-input text-xl font-black" value="${product.price}" min="1">
      </div>
      <div id="price-change-preview" class="p-3 bg-vit-50 dark:bg-vit-900/20 rounded-xl text-center hidden">
        <p class="text-xs text-gray-500">Price change</p>
        <p id="price-change-text" class="font-black text-lg"></p>
      </div>
      <div class="flex gap-3 pt-2">
        <button id="cancel-edit-price-btn" class="flex-1 py-2.5 glass rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform">Cancel</button>
        <button id="confirm-edit-price-btn" class="flex-1 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">Update Price</button>
      </div>
    </div>`;
  modal.classList.add('show');

  const inp = content.querySelector('#new-price-input');
  const preview = content.querySelector('#price-change-preview');
  const previewText = content.querySelector('#price-change-text');
  inp.addEventListener('input', () => {
    const newP = parseFloat(inp.value);
    if (newP && newP !== product.price) {
      const diff = newP - product.price;
      const pct = ((diff/product.price)*100).toFixed(1);
      preview.classList.remove('hidden');
      previewText.textContent = `₹${product.price} → ₹${newP} (${diff>0?'+':''}${pct}%)`;
      previewText.className = `font-black text-lg ${diff<0?'text-emerald-600':'text-rose-500'}`;
    } else { preview.classList.add('hidden'); }
  });

  content.querySelector('#cancel-edit-price-btn').onclick = () => modal.classList.remove('show');
  content.querySelector('#confirm-edit-price-btn').onclick = async () => {
    const newPrice = parseFloat(inp.value);
    if (!newPrice || newPrice <= 0) { showMessage('Enter a valid price.','error'); return; }
    if (newPrice === product.price) { modal.classList.remove('show'); return; }
    const btn = content.querySelector('#confirm-edit-price-btn');
    btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
    try {
      await db.collection('products').doc(product.id).update({ price: newPrice, lastPriceUpdate: firebase.firestore.FieldValue.serverTimestamp() });
      showMessage(`Price updated to ₹${newPrice}! 🎉`,'success');
      modal.classList.remove('show');
    } catch(err) { showMessage('Error: '+err.message,'error'); }
    finally { btn.disabled=false; btn.innerHTML='Update Price'; }
  };
};

// ═══════════════════════════════════════════════════════════
// ░░░  PATCH PRODUCT DETAIL — add negotiation + chat + edit price  ░░░
// ═══════════════════════════════════════════════════════════
const _origRenderProductDetail = renderProductDetailPage;
// Override to add extra buttons + price offers section
const renderProductDetailPageV2 = (product) => {
  _origRenderProductDetail(product);
  const isMyProduct = currentUser?.uid === product.sellerId;

  // buyer actions already rendered in actionHTML (see renderProductDetailPage)

  // Show buyer their own offer status on this product (if any)
  if (!isMyProduct && product.status === 'available') {
    db.collection('products').doc(product.id).collection('price_offers')
      .where('buyerId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc').limit(1).get()
      .then(snap => {
        if (snap.empty) return;
        const offer = { id: snap.docs[0].id, ...snap.docs[0].data() };
        const detailContainer = document.querySelector('#product-detail-tab .container');
        if (!detailContainer || document.getElementById('buyer-offer-status')) return;
        const box = document.createElement('div');
        box.id = 'buyer-offer-status';
        box.className = 'glass rounded-2xl p-5 mt-6';
        const counterSection = offer.status === 'countered' && offer.counterPrice ? `
          <div class="mt-3 p-3 rounded-xl bg-vit-50 dark:bg-vit-900/20 border border-vit-300 dark:border-vit-700">
            <p class="text-xs font-bold text-vit-600 dark:text-vit-400 mb-1">💬 Seller sent a counter offer</p>
            <p class="text-2xl font-black grad-text-vp">₹${offer.counterPrice}</p>
            ${offer.counterMessage ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">"${offer.counterMessage}"</p>` : ''}
            <div class="flex gap-2 mt-3">
              <button id="decline-counter-btn" class="flex-1 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold hover:-translate-y-0.5 transition-transform">✕ Decline Counter</button>
              <button id="accept-counter-btn" class="flex-1 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold hover:-translate-y-0.5 transition-transform" data-counter-price="${offer.counterPrice}">✓ Accept Counter</button>
            </div>
          </div>` : '';
        const statusMap = { pending: '⏳ Pending seller response', accepted: '✅ Accepted!', rejected: '❌ Declined', countered: '💬 Counter received' };
        const statusColor = { pending: 'text-amber-500', accepted: 'text-emerald-500', rejected: 'text-rose-500', countered: 'text-vit-500' };
        box.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-black text-gray-900 dark:text-white text-sm">Your Price Offer</h3>
            <span class="text-xs font-bold ${statusColor[offer.status] || 'text-gray-400'}">${statusMap[offer.status] || offer.status}</span>
          </div>
          <p class="text-2xl font-black grad-text-vp">₹${offer.offerPrice}</p>
          ${offer.message ? `<p class="text-xs text-gray-400 mt-1">"${offer.message}"</p>` : ''}
          ${counterSection}`;
        detailContainer.appendChild(box);

        // Accept counter — treat the counter price as a new agreed price
        box.querySelector('#accept-counter-btn')?.addEventListener('click', () => {
          const agreedPrice = parseFloat(box.querySelector('#accept-counter-btn').dataset.counterPrice);
          showConfirmModal(`Accept counter offer of ₹${agreedPrice}? Contact the seller to arrange payment.`, async () => {
            try {
              await db.collection('products').doc(product.id).collection('price_offers').doc(offer.id)
                .update({ status: 'accepted', finalPrice: agreedPrice });
              showMessage(`Counter accepted at ₹${agreedPrice}! Contact seller via email.`, 'success');
              document.getElementById('buyer-offer-status')?.remove();
            } catch(err) { showMessage('Error: '+err.message, 'error'); }
          });
        });

        // Decline counter — mark as rejected, buyer can make a new offer
        box.querySelector('#decline-counter-btn')?.addEventListener('click', async () => {
          try {
            await db.collection('products').doc(product.id).collection('price_offers').doc(offer.id)
              .update({ status: 'rejected' });
            showMessage('Counter declined. You can make a new offer.', 'success');
            document.getElementById('buyer-offer-status')?.remove();
          } catch(err) { showMessage('Error: '+err.message, 'error'); }
        });
      }).catch(() => {});
  }

  // inject edit price for seller
  // edit price btn and price offers already in renderProductDetailPage base template
};

// ═══════════════════════════════════════════════════════════
// ░░░  PATCH MY-LISTINGS — add edit price button  ░░░
// ═══════════════════════════════════════════════════════════
const _origRenderMyListings = renderMyListingsPage;
const renderMyListingsPageV2 = () => {
  _origRenderMyListings();
  // after render, patch each listing card to add edit price
  setTimeout(() => {
    const myAvail = products.filter(p => p.sellerId===currentUser?.uid && p.status==='available');
    myAvail.forEach(p => {
      const card = document.querySelector(`#my-listings-tab .product-card[data-id="${p.id}"]`) ||
                   document.querySelector(`#my-listings-tab [data-id="${p.id}"]`);
      if (card) {
        const priceEl = card.querySelector('.grad-text-vp');
        if (priceEl && !card.querySelector('.edit-price-btn')) {
          const btn = document.createElement('button');
          btn.className = 'edit-price-btn block mt-1';
          btn.innerHTML = '✏️ Edit Price';
          btn.addEventListener('click', e => { e.stopPropagation(); renderEditPriceModal(p); });
          priceEl.insertAdjacentElement('afterend', btn);
        }
      }
    });

    // ── Inject Buyer Chat Inbox for seller ────────────────
    const tab = document.getElementById('my-listings-tab');
    if (tab && !tab.querySelector('#seller-chat-inbox-section')) {
      const section = document.createElement('div');
      section.id = 'seller-chat-inbox-section';
      section.className = 'mt-10';
      section.innerHTML = `
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(6,182,212,0.1))">💬</div>
            <div>
              <h3 class="text-xl font-black text-gray-900 dark:text-white">Buyer Chats</h3>
              <p class="text-xs text-gray-400">Messages from buyers about your sold items</p>
            </div>
          </div>
        </div>
        <div id="seller-chat-inbox" class="glass rounded-2xl overflow-hidden divide-y divide-vit-500/10 p-2">
          <p class="text-gray-400 text-sm py-4 text-center">Loading chats…</p>
        </div>`;
      tab.appendChild(section);
      renderSellerChatInbox();
    }
  }, 100);
};

// ═══════════════════════════════════════════════════════════
// ░░░  WIRE UP GLOBAL EVENTS  ░░░
// ═══════════════════════════════════════════════════════════
// Intercept product view clicks to use V2 renderer
document.body.addEventListener('click', e => {
  const vdBtn = e.target.closest('[data-action="view-details"]');
  if (vdBtn) {
    const p = products.find(x=>x.id===vdBtn.dataset.id);
    if (p) { setTimeout(() => renderProductDetailPageV2(p), 60); }
  }

}, true);

// patch setActiveTab to use V2 my-listings
const _patchSetActiveTab = setActiveTab;
// Override the my-listings case in the existing switch via monkey-patch
const origMyListingsRender = window.renderMyListingsPage;

// Chat system removed


// Expose key functions globally for inline onclick handlers
window.renderPriceOfferModal = renderPriceOfferModal;
window.renderEditPriceModal = renderEditPriceModal;
window.renderMyListingsPageV2 = renderMyListingsPageV2;


// ═══════════════════════════════════════════════════════════
// ░░░  NOTIFICATION SYSTEM  ░░░
// ═══════════════════════════════════════════════════════════
