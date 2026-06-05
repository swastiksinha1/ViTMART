// ── App State (global scope — shared across all JS files) ──────────────────
let currentUser = null;
let products = [];
let cart = {};
let orders = [];
let lostAndFoundItems = [];
let productUnsubscribe = () => {};
let cartUnsubscribe = () => {};
let ordersUnsubscribe = () => {};
let lostAndFoundUnsubscribe = () => {};
let offersUnsubscribe = () => {};
let uploadedProductFile = null;
let uploadedPfpFile = null;
let uploadedLostFoundFile = null;
let uploadedTradeOfferFile = null;
let selectedAvatarUrl = null;
let emailVerificationInterval = null;
let navigationHistory = ['home'];

// ── DOM References ─────────────────────────────────────────────────────────
let authModal, authModalContent, checkoutModal, checkoutModalContent,
    confirmModal, confirmModalContent, profilePicModal, profilePicModalContent,
    lostAndFoundModal, lostAndFoundModalContent, tradeOfferModal, tradeOfferModalContent,
    changePasswordModal, changePasswordModalContent, termsModal, termsModalContent,
    privacyModal, privacyModalContent, welcomeOverlay, cartDrawer, cartOverlay,
    appContainer, headerActionsContainer, messageContainer, header, popupChatWidget;

document.addEventListener('DOMContentLoaded', () => {

// ── Firebase Init ──────────────────────────────────────────────────────────
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Make auth and db globally accessible for all other JS files
window.auth = auth;
window.db = db;
window.firebase = firebase;

db.enablePersistence({ synchronizeTabs: true })
  .catch(err => {
    if (err.code === 'failed-precondition') console.warn('[ViTMART] Multiple tabs open — offline cache limited to one tab.');
    else if (err.code === 'unimplemented') console.warn('[ViTMART] Offline persistence not supported in this browser.');
  });

// ── DOM Init ───────────────────────────────────────────────────────────────
authModal = document.getElementById('auth-modal');
authModalContent = document.getElementById('auth-modal-content');
checkoutModal = document.getElementById('checkout-modal');
checkoutModalContent = document.getElementById('checkout-modal-content');
confirmModal = document.getElementById('confirm-modal');
confirmModalContent = document.getElementById('confirm-modal-content');
profilePicModal = document.getElementById('profile-pic-modal');
profilePicModalContent = document.getElementById('profile-pic-modal-content');
lostAndFoundModal = document.getElementById('lost-and-found-modal');
lostAndFoundModalContent = document.getElementById('lost-and-found-modal-content');
tradeOfferModal = document.getElementById('trade-offer-modal');
tradeOfferModalContent = document.getElementById('trade-offer-modal-content');
changePasswordModal = document.getElementById('change-password-modal');
changePasswordModalContent = document.getElementById('change-password-modal-content');
termsModal = document.getElementById('terms-modal');
termsModalContent = document.getElementById('terms-modal-content');
privacyModal = document.getElementById('privacy-modal');
privacyModalContent = document.getElementById('privacy-modal-content');
welcomeOverlay = document.getElementById('welcome-overlay');
cartDrawer = document.getElementById('cart-drawer');
cartOverlay = document.getElementById('cart-overlay');
appContainer = document.getElementById('app-container');
headerActionsContainer = document.getElementById('header-actions-container');
messageContainer = document.getElementById('message-container');
header = document.getElementById('app-header');
popupChatWidget = document.getElementById('popup-chat-widget');

// ── Public Data Listeners ──────────────────────────────────────────────────
// Start immediately before auth resolves — marketplace populates instantly
let _publicListenersStarted = false;
const startPublicListeners = () => {
  if (_publicListenersStarted) return;
  _publicListenersStarted = true;

  productUnsubscribe = db.collection('products').orderBy('createdAt','desc').onSnapshot(snap => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    invalidateHomeCache();
    const at = document.querySelector('.tab-content.active');
    if (at && at.id !== 'product-detail-tab') {
      setActiveTab(at.id.replace('-tab', ''), true);
    }
  }, err => { console.error('Products listener error:', err); });

  lostAndFoundUnsubscribe = db.collection('lost_and_found').orderBy('createdAt','desc').onSnapshot(snap => {
    lostAndFoundItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const at = document.querySelector('.tab-content.active');
    if (at && at.id === 'lost-and-found-tab') filterAndRenderLostFoundItems();
    else if (at && at.id === 'home-tab') renderHomepageLostAndFoundPreview();
  }, err => { console.error('Lost & Found listener error:', err); });
};


// ── Auth State ─────────────────────────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (emailVerificationInterval) clearInterval(emailVerificationInterval);
  cartUnsubscribe(); ordersUnsubscribe(); offersUnsubscribe();

  if (user && user.emailVerified) {
    db.collection('users').doc(user.uid).get().then(d => {
      if (!d.exists) db.collection('users').doc(user.uid).set({uid:user.uid,displayName:user.displayName,email:user.email,photoURL:user.photoURL,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    });
    currentUser = user;
    startPublicListeners();
    authModal.classList.remove('show');
    if (!sessionStorage.getItem('welcomeShown')) { showWelcomeAnimation(user); sessionStorage.setItem('welcomeShown','true'); }
    else appContainer.classList.remove('opacity-0');

    cartUnsubscribe = db.collection('carts').doc(currentUser.uid).collection('items').onSnapshot(snap => {
      cart = {};
      snap.forEach(d => { cart[d.id]={id:d.id,...d.data()}; });
      renderCart();
    });
    ordersUnsubscribe = db.collection('orders').where('userId','==',currentUser.uid).onSnapshot(snap => {
      orders = snap.docs
        .map(d => ({id:d.id,...d.data()}))
        .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      const at = document.querySelector('.tab-content.active');
      if (at && at.id === 'orders-tab') renderOrdersPage();
      if (at && at.id === 'manage-tab') renderManagePage();
    }, err => {
      console.error('Orders listener error:', err.code, err.message);
      db.collection('orders').where('userId','==',currentUser.uid).get().then(snap => {
        orders = snap.docs
          .map(d => ({id:d.id,...d.data()}))
          .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const at = document.querySelector('.tab-content.active');
        if (at && at.id === 'orders-tab') renderOrdersPage();
      }).catch(e => console.error('Orders fallback fetch failed:', e));
    });

    renderHeaderActions(); renderPopupChat();
    setActiveTab('home');
    setTimeout(() => document.dispatchEvent(new Event('vitmart-user-ready')), 100);
  } else {
    currentUser = null;
    cart = {}; orders = [];
    navigationHistory = ['home'];
    sessionStorage.removeItem('welcomeShown');
    appContainer.classList.add('opacity-0');
    authModal.classList.add('show');
    if (user && !user.emailVerified) renderAuthModal('verify');
    else renderAuthModal('signin');
    renderHeaderActions();
    popupChatWidget.innerHTML = '';
  }
});

// ── Global Event Listeners ─────────────────────────────────────────────────
document.body.addEventListener('click', e => {
  if (e.target.closest('#clear-order-history-btn')) { handleClearOrderHistory(); return; }
  const resolveBtn = e.target.closest('.resolve-lost-found-btn');
  if (resolveBtn) { handleLostFoundStatusChange(resolveBtn.dataset.id, resolveBtn.dataset.status); return; }

  const navItem = e.target.closest('[data-tab]');
  if (navItem) { setActiveTab(navItem.dataset.tab); return; }

  const catCard = e.target.closest('[data-category]');
  if (catCard) {
    const cat = catCard.dataset.category;
    setActiveTab('buy');
    setTimeout(() => {
      const cf = document.querySelector('#buy-tab #filter-category');
      if (cf) { cf.value = cat; filterAndRenderProducts(false); }
    }, 100);
    return;
  }

  if (e.target.closest('#back-btn')) { handleGoBack(); return; }
  if (e.target.id==='sign-in-btn') { authModal.classList.add('show'); authModal.querySelector('input')?.focus(); }
  if (e.target.id==='show-signup') renderAuthModal('signup');
  if (e.target.id==='show-signin') renderAuthModal('signin');
  if (e.target.id==='sign-out-btn'||e.target.closest('#sign-out-btn')) handleSignOut();
  if (e.target.id==='resend-verification-btn') handleResendVerification();
  if (e.target.closest('#theme-toggle-btn')) toggleTheme();

  if (e.target.closest('#cart-btn')) { cartDrawer.classList.add('open'); cartOverlay.classList.remove('hidden'); cartOverlay.style.opacity='1'; }
  if (e.target.id==='close-cart-btn'||e.target.id==='cart-overlay') { cartDrawer.classList.remove('open'); cartOverlay.style.opacity='0'; setTimeout(()=>cartOverlay.classList.add('hidden'),300); }

  const atcBtn = e.target.closest('.add-to-cart-btn');
  if (atcBtn) { addToCart(atcBtn.dataset.id); return; }
  const delBtn = e.target.closest('.delete-product-btn');
  if (delBtn) { handleDeleteProduct(delBtn.dataset.id); return; }
  const closeBtn = e.target.closest('.close-listing-btn');
  if (closeBtn) {
    showConfirmModal('Close this listing? It will be hidden from the marketplace but not deleted. You can re-list it later from Manage.', async () => {
      try {
        await db.collection('products').doc(closeBtn.dataset.id).update({ status: 'removed' });
        showMessage('Listing closed — hidden from marketplace.', 'success');
      } catch(err) { showMessage('Error: ' + err.message, 'error'); }
    });
    return;
  }
  const reopenBtn = e.target.closest('.reopen-listing-btn');
  if (reopenBtn) {
    showConfirmModal('Re-open this listing? It will appear in the marketplace again.', async () => {
      try {
        await db.collection('products').doc(reopenBtn.dataset.id).update({ status: 'available' });
        showMessage('Listing re-opened! Back in the marketplace.', 'success');
      } catch(err) { showMessage('Error: ' + err.message, 'error'); }
    });
    return;
  }
  const rmBtn = e.target.closest('.remove-from-cart-btn');
  if (rmBtn) { removeFromCart(rmBtn.dataset.id); return; }

  const vdBtn = e.target.closest('[data-action="view-details"]');
  if (vdBtn) {
    const p = products.find(x=>x.id===vdBtn.dataset.id);
    if (p) { renderProductDetailPage(p); setActiveTab('product-detail'); }
    return;
  }

  const pwdToggle = e.target.closest('.password-toggle');
  if (pwdToggle) {
    const inp = pwdToggle.previousElementSibling||pwdToggle.parentElement.querySelector('input');
    const eye = pwdToggle.querySelector('.eye-icon');
    const eyeS = pwdToggle.querySelector('.eye-slash-icon');
    if (inp.type==='password') { inp.type='text'; eye?.classList.add('hidden'); eyeS?.classList.remove('hidden'); }
    else { inp.type='password'; eye?.classList.remove('hidden'); eyeS?.classList.add('hidden'); }
    return;
  }

  if (e.target.id==='checkout-btn') { cartDrawer.classList.remove('open'); cartOverlay.style.opacity='0'; setTimeout(()=>cartOverlay.classList.add('hidden'),300); renderCheckoutModal(); }
  if (e.target.id==='cancel-checkout-btn') checkoutModal.classList.remove('show');
  if (e.target.id==='confirm-payment-btn') handleCheckout();

  if (e.target.id==='change-pic-btn') renderProfilePicModal();
  if (e.target.id==='cancel-pfp-btn') profilePicModal.classList.remove('show');
  if (e.target.id==='save-pfp-btn') handleUpdateProfilePicture();
  if (e.target.id==='change-password-btn') renderChangePasswordModal();
  if (e.target.id==='cancel-change-password-btn') changePasswordModal.classList.remove('show');

  const ocBtn = e.target.closest('#open-popup-chat-btn');
  const ccBtn = e.target.closest('#close-popup-chat-btn');
  const pcC = document.getElementById('popup-chat-container');
  if (ocBtn) { pcC?.classList.add('open'); ocBtn.classList.add('hidden'); }
  if (ccBtn) { pcC?.classList.remove('open'); document.getElementById('open-popup-chat-btn')?.classList.remove('hidden'); }

  const alfBtn = e.target.closest('.add-lost-found-btn');
  if (alfBtn) { renderLostAndFoundModal(alfBtn.dataset.type); return; }
  const dlfBtn = e.target.closest('.delete-lost-found-btn');
  if (dlfBtn) { handleDeleteLostAndFoundItem(dlfBtn.dataset.id); return; }
  if (e.target.id==='cancel-lost-found-btn') lostAndFoundModal.classList.remove('show');

  const mtoBtn = e.target.closest('.make-trade-offer-btn');
  if (mtoBtn) { renderMakeOfferModal(mtoBtn.dataset.productId); return; }
  if (e.target.id==='cancel-trade-offer-btn') tradeOfferModal.classList.remove('show');

  const aoBtn = e.target.closest('.accept-offer-btn');
  if (aoBtn) { handleAcceptOffer(aoBtn.dataset.offerId,aoBtn.dataset.productId,aoBtn.dataset.offererId); return; }
  const roBtn = e.target.closest('.reject-offer-btn');
  if (roBtn) { handleRejectOffer(roBtn.dataset.offerId,roBtn.dataset.productId); return; }

  if (e.target.id==='terms-link') { e.preventDefault(); renderTermsModal(); termsModal.classList.add('show'); }

  const poBtn = e.target.closest('.open-price-offer-btn');
  if (poBtn) {
    if (!currentUser) { authModal.classList.add('show'); showMessage('Please sign in to make an offer.', 'info'); return; }
    const p = products.find(x=>x.id===poBtn.dataset.id)
           || (_currentDetailProduct?.id===poBtn.dataset.id ? _currentDetailProduct : null);
    if (p) renderPriceOfferModal(p);
    else showMessage('Could not find product details. Please refresh and try again.', 'error');
    return;
  }
  const epBtn = e.target.closest('.open-edit-price-btn');
  if (epBtn) {
    const p = products.find(x=>x.id===epBtn.dataset.id);
    if (p) renderEditPriceModal(p);
    return;
  }
  if (e.target.id==='privacy-link') { e.preventDefault(); renderPrivacyModal(); privacyModal.classList.add('show'); }
  const cpBtn = e.target.closest('.close-policy-modal');
  if (cpBtn) { cpBtn.closest('.modal').classList.remove('show'); }
});

document.body.addEventListener('submit', e => {
  e.preventDefault();
  const id = e.target.id;
  if (id==='signup-form') handleSignUp(e);
  else if (id==='signin-form') handleSignIn(e);
  else if (id==='add-product-form') addProduct(e);
  else if (id==='update-profile-form') handleUpdateProfile(e);
  else if (id==='popup-chat-form') handlePopupSendMessage(e);
  else if (id==='lost-and-found-form') handleAddLostAndFoundReport(e);
  else if (id==='trade-offer-form') handleTradeOfferSubmit(e);
  else if (id==='change-password-form') handleChangePassword(e);
});

document.getElementById('footer-date').textContent = new Date().getFullYear();

// ── Page Loader ────────────────────────────────────────────────────────────
const pageLoader = document.getElementById('page-loader');
const loaderBar = document.getElementById('loader-bar');
let loaderPct = 0;
let _loaderHidden = false;
const loaderInterval = setInterval(() => {
  loaderPct = Math.min(loaderPct + Math.random() * 15 + 3, 90);
  if (loaderBar) loaderBar.style.width = loaderPct + '%';
}, 100);
const hideLoader = () => {
  if (_loaderHidden) return;
  _loaderHidden = true;
  clearInterval(loaderInterval);
  if (loaderBar) loaderBar.style.width = '100%';
  setTimeout(() => { if (pageLoader) pageLoader.classList.add('hidden'); }, 300);
};
window.addEventListener('load', () => setTimeout(hideLoader, 400));
setTimeout(hideLoader, 2000);
document.addEventListener('vitmart-user-ready', hideLoader);

// ── Scroll Progress + Back-to-Top ──────────────────────────────────────────
const progressBar = document.getElementById('scroll-progress');
const bttBtn = document.getElementById('back-to-top');
let _scrollRAFPending = false;
const _onScroll = () => {
  if (_scrollRAFPending) return;
  _scrollRAFPending = true;
  requestAnimationFrame(() => {
    const sy    = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (total > 0 ? (sy / total) * 100 : 0) + '%';
    bttBtn?.classList.toggle('visible', sy > 400);
    if (header) header.style.boxShadow = sy > 10 ? '0 4px 30px rgba(139,92,246,0.12)' : 'none';
    _scrollRAFPending = false;
  });
};
window.addEventListener('scroll', _onScroll, { passive: true });
bttBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Mobile Bottom Nav Sync ─────────────────────────────────────────────────
const syncMobileNav = (tabName) => {
  document.querySelectorAll('.mob-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
};
window.__vitSetActiveTab = (tabName, isBack) => {
  setActiveTab(tabName, isBack);
  syncMobileNav(tabName);
};
const tabObserver = new MutationObserver(() => {
  const active = document.querySelector('.tab-content.active');
  if (active) syncMobileNav(active.id.replace('-tab',''));
});
document.querySelectorAll('.tab-content').forEach(t => tabObserver.observe(t, { attributes: true, attributeFilter: ['class'] }));

// ── Command Palette (Ctrl+K) ───────────────────────────────────────────────
const cmdPalette = document.getElementById('command-palette');
const cmdInput = document.getElementById('cmd-input');
const cmdResults = document.getElementById('cmd-results');
let cmdSelectedIdx = -1;

const cmdCommands = [
  { icon:'🏠', label:'Go to Home', desc:'Main landing page', action:()=>setActiveTab('home'), bg:'bg-vit-100 dark:bg-vit-900/30' },
  { icon:'🛒', label:'Buy Items', desc:'Browse all available listings', action:()=>setActiveTab('buy'), bg:'bg-cyan-100 dark:bg-cyan-900/30' },
  { icon:'💰', label:'Sell an Item', desc:'List a new product for sale', action:()=>setActiveTab('sell'), bg:'bg-emerald-100 dark:bg-emerald-900/30' },
  { icon:'🔄', label:'Trade/Barter', desc:'Browse tradeable items', action:()=>setActiveTab('trade'), bg:'bg-amber-100 dark:bg-amber-900/30' },
  { icon:'🔍', label:'Lost & Found', desc:'Report or find lost items', action:()=>setActiveTab('lost-and-found'), bg:'bg-rose-100 dark:bg-rose-900/30' },
  { icon:'📋', label:'My Listings', desc:'View your listed items', action:()=>setActiveTab('my-listings'), bg:'bg-purple-100 dark:bg-purple-900/30' },
  { icon:'📦', label:'My Orders', desc:'View order history', action:()=>setActiveTab('orders'), bg:'bg-gray-100 dark:bg-gray-800' },
  { icon:'👤', label:'My Profile', desc:'Account settings & info', action:()=>setActiveTab('profile'), bg:'bg-vit-100 dark:bg-vit-900/30' },
  { icon:'⭐', label:'Reviews', desc:'Read & write campus reviews', action:()=>setActiveTab('reviews'), bg:'bg-amber-100 dark:bg-amber-900/30' },
  { icon:'📌', label:'Noticeboard', desc:'Post requests, announce items', action:()=>setActiveTab('noticeboard'), bg:'bg-amber-100 dark:bg-amber-900/30' },
  { icon:'🗑️', label:'Manage & Cleanup', desc:'Delete old items & history', action:()=>setActiveTab('manage'), bg:'bg-rose-100 dark:bg-rose-900/30' },
  { icon:'🌙', label:'Toggle Dark Mode', desc:'Switch light/dark theme', action:()=>toggleTheme(), bg:'bg-gray-100 dark:bg-gray-800' },
  { icon:'💬', label:'Open Chat Assistant', desc:'Talk to ViT Assistant', action:()=>{ document.getElementById('popup-chat-container')?.classList.add('open'); document.getElementById('open-popup-chat-btn')?.classList.add('hidden'); }, bg:'bg-vit-100 dark:bg-vit-900/30' },
];

const openCmdPalette = () => { cmdPalette?.classList.add('show'); cmdInput?.focus(); cmdSelectedIdx = -1; renderCmdResults(''); };
const closeCmdPalette = () => { cmdPalette?.classList.remove('show'); if(cmdInput) cmdInput.value = ''; };

const renderCmdResults = (query) => {
  if (!cmdResults) return;
  const q = query.toLowerCase().trim();
  let filtered = cmdCommands;
  if (q) filtered = cmdCommands.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  const productResults = q ? products.filter(p => p.name.toLowerCase().includes(q) && p.status==='available').slice(0,3).map(p => ({
    icon:'📌', label:p.name, desc:`₹${p.price} · ${p.category}`,
    action:()=>{ renderProductDetailPage(p); setActiveTab('product-detail'); },
    bg:'bg-gray-100 dark:bg-gray-800'
  })) : [];
  const all = [...filtered, ...productResults].slice(0, 8);
  cmdSelectedIdx = -1;
  cmdResults.innerHTML = all.length === 0
    ? `<p class="text-center text-gray-400 py-6 text-sm">No results for "${query}"</p>`
    : all.map((cmd, i) => `
      <div class="cmd-item" data-cmd-idx="${i}">
        <div class="cmd-item-icon ${cmd.bg}">${cmd.icon}</div>
        <div class="flex-grow min-w-0">
          <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">${cmd.label}</p>
          <p class="text-xs text-gray-400 truncate">${cmd.desc}</p>
        </div>
        <svg class="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>`).join('');
  cmdResults.querySelectorAll('.cmd-item').forEach((el, i) => {
    el.addEventListener('click', () => { all[i].action(); closeCmdPalette(); });
  });
};

cmdInput?.addEventListener('input', e => renderCmdResults(e.target.value));
cmdInput?.addEventListener('keydown', e => {
  const items = cmdResults?.querySelectorAll('.cmd-item');
  if (!items?.length) return;
  if (e.key==='ArrowDown') { e.preventDefault(); cmdSelectedIdx = Math.min(cmdSelectedIdx+1, items.length-1); items.forEach((el,i) => el.classList.toggle('selected', i===cmdSelectedIdx)); items[cmdSelectedIdx]?.scrollIntoView({block:'nearest'}); }
  else if (e.key==='ArrowUp') { e.preventDefault(); cmdSelectedIdx = Math.max(cmdSelectedIdx-1, 0); items.forEach((el,i) => el.classList.toggle('selected', i===cmdSelectedIdx)); items[cmdSelectedIdx]?.scrollIntoView({block:'nearest'}); }
  else if (e.key==='Enter') { if (cmdSelectedIdx >= 0) items[cmdSelectedIdx]?.click(); else if (items[0]) items[0].click(); }
});
document.addEventListener('keydown', e => {
  if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); cmdPalette?.classList.contains('show') ? closeCmdPalette() : openCmdPalette(); }
  if (e.key==='Escape') closeCmdPalette();
});
cmdPalette?.addEventListener('click', e => { if (e.target===cmdPalette) closeCmdPalette(); });
document.getElementById('open-cmd-palette-btn')?.addEventListener('click', openCmdPalette);
document.body.addEventListener('click', e => { if (e.target.closest('#open-cmd-palette-btn')) openCmdPalette(); });

// ── Wishlist ───────────────────────────────────────────────────────────────
const getWishlist = () => JSON.parse(localStorage.getItem('vitmart_wishlist') || '[]');
const toggleWishlist = (productId) => {
  const wl = getWishlist();
  const idx = wl.indexOf(productId);
  if (idx > -1) { wl.splice(idx, 1); showMessage('Removed from wishlist.', 'success'); }
  else { wl.push(productId); showMessage('❤️ Added to wishlist!', 'success'); const wlProd = products.find(p=>p.id===productId); if (wlProd) recLog(wlProd, 'wishlist'); }
  localStorage.setItem('vitmart_wishlist', JSON.stringify(wl));
  document.querySelectorAll(`.wishlist-btn[data-id="${productId}"]`).forEach(btn => { btn.classList.toggle('wishlisted', wl.includes(productId)); });
};
document.body.addEventListener('click', e => { const wb = e.target.closest('.wishlist-btn'); if (wb) { e.stopPropagation(); toggleWishlist(wb.dataset.id); } });

// ── 3D Card Tilt ───────────────────────────────────────────────────────────
const applyTilt = (e, card) => {
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2;
  const dx = (e.clientX - cx) / (rect.width / 2); const dy = (e.clientY - cy) / (rect.height / 2);
  const maxTilt = 8;
  card.style.transform = `perspective(700px) rotateY(${dx * maxTilt}deg) rotateX(${-dy * maxTilt}deg) translateZ(4px) translateY(-8px) scale(1.01)`;
  const shine = card.querySelector('.tilt-shine');
  if (shine) { const mx = ((e.clientX - rect.left) / rect.width) * 100; const my = ((e.clientY - rect.top) / rect.height) * 100; shine.style.setProperty('--mx', mx + '%'); shine.style.setProperty('--my', my + '%'); }
};
const resetTilt = (card) => { card.style.transform = ''; };
document.body.addEventListener('mousemove', e => { const card = e.target.closest('.tilt-card'); if (card) applyTilt(e, card); });
document.body.addEventListener('mouseleave', e => { const card = e.target.closest('.tilt-card'); if (card) resetTilt(card); }, true);
document.body.addEventListener('mouseout', e => { if (e.target.classList.contains('tilt-card')) resetTilt(e.target); });

// ── Image Lightbox ─────────────────────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
document.body.addEventListener('click', e => {
  const trigger = e.target.closest('.lightbox-trigger');
  if (trigger && trigger.src && !e.target.closest('.product-card [data-action]')) {
    if (e.target === trigger) { e.stopPropagation(); if (lightboxImg) lightboxImg.src = trigger.dataset.src || trigger.src; lightbox?.classList.add('show'); }
  }
  if (e.target.id==='lightbox' || e.target.id==='lightbox-close') lightbox?.classList.remove('show');
});
document.addEventListener('keydown', e => { if (e.key==='Escape') lightbox?.classList.remove('show'); });

// ── Quick View Modal ───────────────────────────────────────────────────────
document.body.addEventListener('click', e => {
  const qvBtn = e.target.closest('.quick-view-btn');
  if (qvBtn) {
    e.stopPropagation();
    const productId = qvBtn.dataset.id;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = document.getElementById('quick-view-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'quick-view-overlay';
    overlay.className = 'fixed inset-0 bg-gray-950/70 backdrop-blur-md z-[8000] flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="glass-strong rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" style="animation:tab-reveal 0.35s cubic-bezier(0.22,1.2,0.36,1) forwards">
        <div class="relative">
          <img src="${optimizeImage(product.imageUrl,600)||'https://placehold.co/400x300/e8e0ff/7c3aed?text=?'}" class="w-full h-52 object-cover" loading="lazy" decoding="async">
          <button id="close-qv" class="absolute top-3 right-3 w-8 h-8 glass rounded-xl flex items-center justify-center text-white text-lg hover:bg-white/20 transition-colors">&times;</button>
          ${product.isTradeable?`<div class="badge-tradeable">🔄 Trade</div>`:''}
        </div>
        <div class="p-5">
          <p class="text-xs text-gray-400 mb-1">by ${esc(product.sellerName)}</p>
          <h3 class="text-lg font-black font-syne text-gray-900 dark:text-white">${esc(product.name)}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed line-clamp-3">${esc(product.description)}</p>
          <div class="flex items-center justify-between mt-4">
            <span class="text-2xl font-black font-syne grad-text-vp">₹${product.price.toFixed(0)}</span>
            <div class="flex gap-2">
              ${product.isTradeable?`<button class="make-trade-offer-btn px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl" data-product-id="${product.id}">Trade</button>`:''}
              <button class="add-to-cart-btn px-4 py-2 bg-gradient-to-r from-vit-600 to-vit-700 text-white text-xs font-bold rounded-xl shimmer-btn" data-id="${product.id}">Add to Cart</button>
            </div>
          </div>
          <button class="mt-3 w-full text-center text-sm text-vit-600 dark:text-vit-400 font-semibold hover:underline" id="qv-view-full">View Full Details →</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if(e.target===overlay||e.target.id==='close-qv') overlay.remove(); });
    document.getElementById('qv-view-full')?.addEventListener('click', () => { overlay.remove(); renderProductDetailPage(product); setActiveTab('product-detail'); });
  }
});

// ── Intercept product view clicks to use V2 renderer ──────────────────────
document.body.addEventListener('click', e => {
  const vdBtn = e.target.closest('[data-action="view-details"]');
  if (vdBtn) {
    const p = products.find(x=>x.id===vdBtn.dataset.id);
    if (p) { setTimeout(() => renderProductDetailPageV2(p), 60); }
  }
}, true);

// ── Wire review delete globally ────────────────────────────────────────────
document.body.addEventListener('click', e => {
  const drBtn = e.target.closest('.delete-review-btn');
  if (drBtn) {
    showConfirmModal('Delete this review?', async () => {
      try { await db.collection('reviews').doc(drBtn.dataset.id).delete(); showMessage('Deleted.','success'); }
      catch(err) { showMessage('Error.','error'); }
    });
  }
});

// ── Buy tab recommendations observer ──────────────────────────────────────
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

// ── Home tab recommendations observer ─────────────────────────────────────
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
        homeTabEl.appendChild(div);
      }
    }
  }
});
if (homeTabEl) homeRecObs.observe(homeTabEl, { attributes:true, subtree:false, attributeFilter:['class'] });

// Track product view for recommendations
document.body.addEventListener('click', e => {
  const vdBtn = e.target.closest('[data-action="view-details"]');
  if (vdBtn) { const p = products.find(x=>x.id===vdBtn.dataset.id); if (p) trackBrowse(p); }
}, true);

// ── Notifications wiring ───────────────────────────────────────────────────
document.addEventListener('vitmart-user-ready', () => { startNotifListener(); });
if (currentUser) startNotifListener();

window._afterCheckoutNotify = async (purchasedItems) => {
  for (const item of purchasedItems) {
    const p = products.find(x => x.id === item.id || x.id === item.productId);
    if (p && p.sellerId && p.sellerId !== currentUser?.uid) {
      await sendNotification(p.sellerId, {
        type: 'purchase',
        title: '🛒 Item Sold!',
        body: `Your listing "${p.name}" was purchased by ${currentUser.displayName || 'a buyer'}.`,
        productId: p.id
      });
    }
  }
};

// ── Chat FAB Init ──────────────────────────────────────────────────────────
document.addEventListener('vitmart-user-ready', () => { injectChatFab(); });
if (currentUser) injectChatFab();

// Remove old header bell if exists
document.getElementById('chat-bell-btn')?.closest('div')?.remove();
document.getElementById('chat-header-badge')?.closest('div')?.remove();

if (typeof NOTIF_ICONS !== 'undefined') {
  NOTIF_ICONS['chat'] = { bg:'bg-blue-100 dark:bg-blue-900/40', icon:'💬' };
}

window.renderPriceOfferModal = renderPriceOfferModal;
window.renderEditPriceModal = renderEditPriceModal;
window.openChat = openChat;

// ── Lazy Load ──────────────────────────────────────────────────────────────
const applyLazyLoad = () => {
  document.querySelectorAll('img:not([loading])').forEach(img => {
    img.loading = 'lazy'; img.decoding = 'async';
    img.style.transition = 'opacity 0.45s cubic-bezier(0.25,1,0.5,1)';
    img.style.opacity = img.complete ? '1' : '0';
    if (!img.complete) img.addEventListener('load', () => { img.style.opacity = '1'; }, { once: true });
  });
};
applyLazyLoad();
const _imgObserver = new MutationObserver(() => applyLazyLoad());
_imgObserver.observe(document.body, { childList: true, subtree: true });

// ── Ripple Effect ──────────────────────────────────────────────────────────
const _addRipple = (e) => {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.6;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top  - size / 2;
  const wave = document.createElement('span');
  wave.className = 'ripple-wave';
  wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  btn.appendChild(wave);
  wave.addEventListener('animationend', () => wave.remove(), { once: true });
};
const _applyRipples = () => {
  document.querySelectorAll('button:not([data-no-ripple]):not(.wishlist-btn):not(.mob-nav-item)').forEach(btn => {
    if (btn.dataset.rippleReady) return;
    btn.dataset.rippleReady = '1';
    if (!btn.classList.contains('ripple-host')) btn.classList.add('ripple-host');
    btn.addEventListener('click', _addRipple);
  });
};
_applyRipples();
const _rippleObserver = new MutationObserver(_applyRipples);
_rippleObserver.observe(document.body, { childList: true, subtree: true });

// ── Smooth Scrolling ───────────────────────────────────────────────────────
document.querySelectorAll('.overflow-y-auto, .overflow-x-auto').forEach(el => {
  el.style.webkitOverflowScrolling = 'touch';
});

// ── Mobile Swipe-Down to Close Modals ─────────────────────────────────────
if (window.matchMedia('(max-width: 640px)').matches) {
  const MODALS = [authModal, checkoutModal, profilePicModal, lostAndFoundModal,
                  tradeOfferModal, changePasswordModal, termsModal, privacyModal].filter(Boolean);
  MODALS.forEach(modal => {
    const content = modal.querySelector('.modal-content');
    if (!content) return;
    if (!content.querySelector('.drag-handle')) {
      const handle = document.createElement('div');
      handle.className = 'drag-handle';
      handle.style.cssText = 'width:36px;height:4px;background:rgba(139,92,246,0.25);border-radius:99px;margin:0 auto 12px;flex-shrink:0;';
      content.prepend(handle);
    }
    let startY = 0, currentY = 0, isDragging = false;
    content.addEventListener('touchstart', e => { if (content.scrollTop > 2) return; startY = e.touches[0].clientY; isDragging = true; content.style.transition = 'none'; }, { passive: true });
    content.addEventListener('touchmove', e => { if (!isDragging) return; currentY = e.touches[0].clientY - startY; if (currentY < 0) { currentY = 0; return; } content.style.transform = `translateY(${currentY}px)`; }, { passive: true });
    content.addEventListener('touchend', () => {
      if (!isDragging) return; isDragging = false; content.style.transition = '';
      if (currentY > 130) { content.style.transform = 'translateY(100%)'; setTimeout(() => { modal.classList.remove('show'); content.style.transform = ''; }, 300); }
      else { content.style.transform = ''; }
      currentY = 0;
    });
  });
}

}); // end DOMContentLoaded
