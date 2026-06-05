const renderHeaderActions = () => {
  headerActionsContainer.innerHTML = '';
  const themeToggle = `
    <button id="theme-toggle-btn" aria-label="Toggle theme" class="p-2 rounded-xl glass hover:shadow-lg hover:shadow-vit-500/20 transition-all duration-200 animate-subtle-pop" style="animation-delay:0ms">
      <svg class="w-5 h-5 dark:hidden text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
      <svg class="w-5 h-5 hidden dark:block text-vit-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
    </button>`;

  if (currentUser) {
    const cartCount = Object.keys(cart).length;
    const profileIcon = currentUser.photoURL
      ? `<img src="${currentUser.photoURL}" class="h-9 w-9 rounded-xl object-cover ring-2 ring-vit-500/50">`
      : `<div class="h-9 w-9 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white text-sm">${getInitials(currentUser.displayName)}</div>`;
    headerActionsContainer.innerHTML = `
      ${themeToggle}
      <button id="notif-bell-btn" class="icon-btn p-2 rounded-xl glass hover:shadow-lg hover:shadow-vit-500/20 transition-all duration-200 animate-subtle-pop" data-tooltip="Notifications" aria-label="Notifications">
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        <span id="notif-unread-badge">0</span>
      </button>

      <button data-tab="manage" class="icon-btn p-2 rounded-xl glass hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-200 animate-subtle-pop" data-tooltip="Manage" style="animation-delay:75ms" aria-label="Manage data">
        <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </button>
      <button id="cart-btn" aria-label="Cart" class="icon-btn relative p-2 rounded-xl glass hover:shadow-lg hover:shadow-vit-500/20 transition-all duration-200 animate-subtle-pop" data-tooltip="Cart" style="animation-delay:100ms">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        ${cartCount > 0 ? `<span class="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-vit-600 to-cyan-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">${cartCount}</span>` : ''}
      </button>
      <button data-tab="profile" class="icon-btn animate-subtle-pop transition-all duration-200 hover:scale-105 rounded-xl" data-tooltip="Profile" style="animation-delay:200ms">${profileIcon}</button>
      <button id="sign-out-btn" class="hidden sm:block px-4 py-2 glass rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-vit-500/20 hover:-translate-y-0.5 transition-all animate-subtle-pop" style="animation-delay:300ms">Sign Out</button>`;
  } else {
    headerActionsContainer.innerHTML = `
      ${themeToggle}
      <button id="sign-in-btn" class="px-5 py-2 bg-gradient-to-r from-vit-600 to-vit-700 text-white text-sm font-semibold rounded-xl shimmer-btn animate-subtle-pop shadow-lg shadow-vit-500/30" style="animation-delay:100ms">Sign In</button>`;
  }
};

// --- Cart ---
const renderCart = () => {
  const items = Object.values(cart);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  cartDrawer.innerHTML = `
    <div class="p-6 border-b border-vit-900/20 dark:border-vit-400/10 flex justify-between items-center">
      <h2 class="text-xl font-bold font-syne grad-text-vp">Your Cart</h2>
      <button id="close-cart-btn" class="w-8 h-8 glass rounded-lg flex items-center justify-center hover:text-rose-500 transition-colors text-lg">&times;</button>
    </div>
    <div class="flex-grow p-6 overflow-y-auto space-y-3">
      ${items.length > 0 ? items.map(item => `
        <div class="flex items-center space-x-4 p-3 glass rounded-xl">
          <img src="${optimizeImage(item.imageUrl,120)}" class="w-14 h-14 object-cover rounded-lg flex-shrink-0" loading="lazy" decoding="async">
          <div class="flex-grow min-w-0">
            <p class="font-semibold truncate text-sm">${item.name}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">₹${item.price.toFixed(0)}</p>
          </div>
          <button class="remove-from-cart-btn p-1.5 text-gray-400 hover:text-rose-500 rounded-lg glass transition-colors" data-id="${item.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>`).join('') : `<div class="flex flex-col items-center justify-center h-full text-center pb-12"><div class="text-6xl mb-4">🛒</div><p class="text-gray-400 dark:text-gray-500 font-medium">Your cart is empty</p></div>`}
    </div>
    <div class="p-6 border-t border-vit-900/20 dark:border-vit-400/10">
      <div class="flex justify-between items-center mb-4">
        <span class="font-semibold">Total</span>
        <span class="text-2xl font-bold font-syne grad-text-vp">₹${total.toFixed(0)}</span>
      </div>
      <button id="checkout-btn" class="w-full py-3 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30 disabled:opacity-50 disabled:cursor-not-allowed" ${items.length===0?'disabled':''}>
        Proceed to Checkout
      </button>
    </div>`;
  renderHeaderActions();
};

const renderCheckoutModal = () => {
  const total = Object.values(cart).reduce((s,i) => s + i.price*i.quantity, 0);
  checkoutModalContent.innerHTML = `
    <div class="p-6">
      <div class="text-center mb-6">
        <div class="w-14 h-14 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-vit-500/30">💳</div>
        <h2 class="text-2xl font-bold font-syne">Complete Payment</h2>
        <p class="text-gray-500 mt-1">Total: <span class="font-bold grad-text-vp text-lg">₹${total.toFixed(0)}</span></p>
      </div>
      <form id="checkout-form" class="space-y-4">
        <div><label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Pay via UPI</label><input type="text" placeholder="yourname@upi" class="vit-input"></div>
        <div class="flex items-center gap-3"><div class="h-px flex-grow bg-gray-200 dark:bg-gray-700"></div><span class="text-xs text-gray-400 font-medium">OR</span><div class="h-px flex-grow bg-gray-200 dark:bg-gray-700"></div></div>
        <div><label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Card Number</label><input type="text" placeholder="•••• •••• •••• ••••" class="vit-input"></div>
      </form>
      <p class="text-xs text-center text-gray-400 mt-4">⚠️ Simulated payment — no real transaction occurs.</p>
      <div class="flex gap-3 mt-6">
        <button id="cancel-checkout-btn" class="flex-1 py-2.5 glass rounded-xl font-semibold text-sm hover:-translate-y-0.5 transition-transform">Cancel</button>
        <button id="confirm-payment-btn" class="flex-1 py-2.5 bg-gradient-to-r from-vit-600 to-cyan-600 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">Pay Now</button>
      </div>
    </div>`;
  checkoutModal.classList.add('show');
};

// --- Home Page ---
// ── Safe render — catches errors so one broken tab never crashes the app ─────
const safeRender = (fn, label = fn.name) => {
  try { fn(); }
  catch (err) {
    console.error(`[ViTMART] Render error in ${label}:`, err);
    showMessage('Something went wrong loading this page. Please try again.', 'error');
  }
};

// ── Home page cache — avoids rebuilding 1000-line HTML string on every visit ─
let _homeCache = null;
let _homeCacheTime = 0;
let _homeCacheProductCount = 0;
const HOME_TTL = 45_000; // 45 seconds
