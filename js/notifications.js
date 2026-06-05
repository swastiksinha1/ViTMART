let notifUnsubscribe = () => {};

const NOTIF_ICONS = {
  trade_offer:    { bg:'bg-emerald-100 dark:bg-emerald-900/40', icon:'🔄' },
  trade_accepted: { bg:'bg-emerald-100 dark:bg-emerald-900/40', icon:'✅' },
  purchase:       { bg:'bg-vit-100 dark:bg-vit-900/40',        icon:'🛒' },
  price_offer:    { bg:'bg-amber-100 dark:bg-amber-900/40',    icon:'💰' },
  default:        { bg:'bg-gray-100 dark:bg-gray-800',         icon:'🔔' }
};

// Write a notification document for a target user
const sendNotification = async (targetUid, { type, title, body, productId }) => {
  if (!targetUid || targetUid === currentUser?.uid) return; // don't notify yourself
  try {
    await db.collection('notifications').add({
      uid: targetUid,
      type: type || 'default',
      title,
      body,
      productId: productId || null,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { console.warn('sendNotification failed:', e.message); }
};

// Start listening for current user's notifications
const startNotifListener = () => {
  if (!currentUser) return;
  notifUnsubscribe();
  notifUnsubscribe = db.collection('notifications')
    .where('uid', '==', currentUser.uid)
    .limit(50)
    .onSnapshot(snap => {
      // Sort client-side to avoid needing a composite Firestore index
      const notifs = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        .slice(0, 30);
      const unread = notifs.filter(n => !n.read).length;
      updateNotifBadge(unread);
      renderNotifList(notifs);
    }, err => console.warn('Notif listener error:', err.code));
};

const updateNotifBadge = (count) => {
  const badge = document.getElementById('notif-unread-badge');
  if (!badge) return;
  badge.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent = count > 9 ? '9+' : String(count);
};

const renderNotifList = (notifs) => {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!notifs.length) {
    list.innerHTML = '<p class="text-center text-gray-400 text-sm py-8">You\'re all caught up! 🎉</p>';
    return;
  }
  list.innerHTML = notifs.map(n => {
    const meta = NOTIF_ICONS[n.type] || NOTIF_ICONS.default;
    const ts = n.createdAt ? timeAgoStr(n.createdAt.toDate ? n.createdAt.toDate() : new Date()) : '';
    return `<div class="notif-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}" data-product-id="${n.productId || ''}" data-notif-type="${n.type || 'default'}">
      <div class="notif-icon-box ${meta.bg}">${meta.icon}</div>
      <div class="flex-grow min-w-0">
        <p class="font-bold text-sm text-gray-900 dark:text-white">${esc(n.title)}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">${esc(n.body)}</p>
        <p class="text-xs text-gray-300 dark:text-gray-600 mt-1">${ts}</p>
      </div>
      <div class="flex flex-col items-end gap-1 flex-shrink-0">
        ${!n.read ? '<div class="notif-dot"></div>' : ''}
        <button class="delete-notif-btn w-5 h-5 flex items-center justify-center text-gray-300 hover:text-rose-500 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20" data-notif-id="${n.id}" title="Delete notification" onclick="event.stopPropagation()">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  // Delete individual notification
  list.querySelectorAll('.delete-notif-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const nid = btn.dataset.notifId;
      const item = btn.closest('.notif-item');
      // Animate out
      item.style.transition = 'opacity 0.2s, transform 0.2s, max-height 0.25s';
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      item.style.maxHeight = item.offsetHeight + 'px';
      setTimeout(() => {
        item.style.maxHeight = '0';
        item.style.overflow = 'hidden';
        item.style.padding = '0';
        item.style.borderBottom = 'none';
      }, 180);
      setTimeout(() => item.remove(), 400);
      // Delete from Firestore
      db.collection('notifications').doc(nid).delete().catch(() => {});
    });
  });

  list.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', async () => {
      // Mark as read
      if (item.classList.contains('unread')) {
        db.collection('notifications').doc(item.dataset.notifId).update({ read: true }).catch(() => {});
        item.classList.remove('unread');
        item.querySelector('.notif-dot')?.remove();
      }
      closeNotifDropdown();

      const type = item.dataset.notifType;
      const pid  = item.dataset.productId;

      // Route based on notification type
      if (type === 'purchase' || type === 'trade_accepted') {
        // Seller got a purchase / buyer's trade was accepted → open orders
        // Force a fresh fetch so the new order appears immediately
        db.collection('orders').where('userId','==',currentUser.uid).get()
          .then(snap => {
            if (!snap.empty) {
              orders = snap.docs
                .map(d => ({id:d.id,...d.data()}))
                .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            }
            setActiveTab('orders');
          })
          .catch(() => setActiveTab('orders'));

      } else if (type === 'trade_offer') {
        // Seller received a trade offer → activate the tab FIRST, then render
        // so setActiveTab's offersUnsubscribe() fires before the listener is set up
        setActiveTab('product-detail');
        if (pid) {
          const p = products.find(x => x.id === pid);
          if (p) { renderProductDetailPage(p); }
          else setActiveTab('my-listings');
        } else { setActiveTab('my-listings'); }

      } else if (type === 'price_offer') {
        // Seller received a price offer → activate tab first, then render
        setActiveTab('product-detail');
        if (pid) {
          const p = products.find(x => x.id === pid);
          if (p) { renderProductDetailPage(p); }
          else setActiveTab('my-listings');
        } else { setActiveTab('my-listings'); }

      } else if (pid) {
        // Generic — open product detail if we have a product id
        const p = products.find(x => x.id === pid);
        if (p) { renderProductDetailPage(p); setActiveTab('product-detail'); }
        else setActiveTab('buy');

      } else {
        setActiveTab('orders'); // safe fallback
      }
    });
  });
};

const openNotifDropdown = () => {
  const dd = document.getElementById('notif-dropdown');
  if (!dd) return;
  dd.classList.add('open');
};
const closeNotifDropdown = () => {
  document.getElementById('notif-dropdown')?.classList.remove('open');
};

// Bell button toggle
document.body.addEventListener('click', e => {
  const bell = e.target.closest('#notif-bell-btn');
  if (bell) { e.stopPropagation(); document.getElementById('notif-dropdown')?.classList.contains('open') ? closeNotifDropdown() : openNotifDropdown(); return; }
  // Mark all read button
  if (e.target.id === 'mark-all-read-btn') {
    e.stopPropagation();
    // Update DOM immediately (optimistic)
    document.querySelectorAll('.notif-item.unread').forEach(el => {
      el.classList.remove('unread');
      el.querySelector('.notif-dot')?.remove();
    });
    updateNotifBadge(0);
    // Then write to Firestore
    db.collection('notifications').where('uid','==',currentUser?.uid).where('read','==',false).get()
      .then(snap => {
        if (snap.empty) return;
        const batch = db.batch();
        snap.docs.forEach(d => batch.update(d.ref, {read: true}));
        return batch.commit();
      }).catch(() => {});
    return;
  }
  // Close dropdown when clicking outside
  if (!e.target.closest('#notif-dropdown') && !e.target.closest('#notif-bell-btn')) {
    closeNotifDropdown();
  }
});

// ── Wire notifications into existing buy/trade flows ─────────────────────

// trade offer notify handled directly inside handleTradeOfferSubmit

// Patch handleCheckout to notify sellers of purchases
const _origHandleCheckout = handleCheckout;
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

// price offer notify is handled directly inside renderPriceOfferModal

// Start notif listener when user logs in
document.addEventListener('vitmart-user-ready', () => { startNotifListener(); });
if (currentUser) startNotifListener();

// ═══════════════════════════════════════════════════════════
// ORDER CHAT SYSTEM — FULL BIDIRECTIONAL REAL-TIME
// ═══════════════════════════════════════════════════════════
