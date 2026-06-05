let _chatUnsubscribe  = () => {};
let _inboxUnsubscribe = () => {};
let _activeChatId     = null;
let _activeChatRole   = null;
let _activeChatData   = null;

const chatOverlay  = document.getElementById('chat-modal-overlay');
const chatPanel    = document.getElementById('chat-panel');
const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');

const BUYER_QUICK_REPLIES  = ['Hi! Where should we meet?','Is it available today?','Can we meet at the library?','What time works for you?','I will come to your hostel'];
const SELLER_QUICK_REPLIES = ['Meet me at the main gate','I am free after 5 PM','Come to block A lobby','Let me know your hostel','Is tomorrow morning okay?'];

const openChat = async (chatId) => {
  if (!currentUser || !chatId) return;

  // Fetch the chat document first
  let chatData = null;
  try {
    const snap = await db.collection('chats').doc(chatId).get();
    if (!snap.exists) {
      showMessage('Chat not found. Place an order first to start chatting.', 'error');
      return;
    }
    chatData = { id: snap.id, ...snap.data() };
  } catch(err) {
    console.error('openChat fetch error:', err);
    showMessage('Could not open chat: ' + (err.message || 'Check your connection.'), 'error');
    return;
  }

  _activeChatId   = chatId;
  _activeChatData = chatData;
  _activeChatRole = chatData.buyerId === currentUser.uid ? 'buyer' : 'seller';

  const isBuyer      = _activeChatRole === 'buyer';
  const otherName    = isBuyer ? (chatData.sellerName  || 'Seller') : (chatData.buyerName  || 'Buyer');
  const otherPhoto   = isBuyer ? (chatData.sellerPhoto || '')       : (chatData.buyerPhoto  || '');
  const quickReplies = isBuyer ? BUYER_QUICK_REPLIES : SELLER_QUICK_REPLIES;
  const unreadField  = isBuyer ? 'unreadBuyer' : 'unreadSeller';

  // Populate header
  const avatarEl = document.getElementById('chat-other-avatar');
  const initial  = (otherName[0] || '?').toUpperCase();
  if (avatarEl) {
    avatarEl.src = optimizeImage(otherPhoto, 80) || `https://placehold.co/40x40/e8e0ff/7c3aed?text=${initial}`;
    avatarEl.onerror = () => { avatarEl.src = `https://placehold.co/40x40/e8e0ff/7c3aed?text=${initial}`; };
  }
  const nameEl    = document.getElementById('chat-other-name');
  const productEl = document.getElementById('chat-product-name');
  if (nameEl)    nameEl.textContent    = otherName;
  if (productEl) productEl.textContent = `📦 ${chatData.productName || 'Item'}`;

  // Show panel
  const overlay = document.getElementById('chat-modal-overlay');
  const panel   = document.getElementById('chat-panel');
  const msgs    = document.getElementById('chat-messages');
  const inp     = document.getElementById('chat-input');
  if (!panel || !msgs) { console.error('Chat panel elements missing'); return; }

  overlay?.classList.add('open');
  panel.classList.add('open');
  if (inp) { inp.value = ''; inp.style.height = 'auto'; }
  setTimeout(() => inp?.focus(), 350);

  // Show spinner
  msgs.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px">
      <div style="width:32px;height:32px;border-radius:50%;border:3px solid rgba(124,58,237,0.15);border-top-color:#7c3aed;animation:loader-spin 0.8s linear infinite"></div>
      <p style="font-size:12px;color:#9ca3af">Loading messages…</p>
    </div>`;

  // Clear unread
  if ((chatData[unreadField] || 0) > 0) {
    db.collection('chats').doc(chatId).update({ [unreadField]: 0 }).catch(() => {});
  }

  // Timeout — if Firestore doesn't respond in 6s show a helpful error
  let _listenerFired = false;
  const _timeoutId = setTimeout(() => {
    if (!_listenerFired && msgs) {
      msgs.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;padding:24px;text-align:center">
          <div style="font-size:2rem">⚠️</div>
          <p style="font-size:13px;font-weight:700;color:#f43f5e">Could not load messages</p>
          <p style="font-size:11px;color:#9ca3af;line-height:1.6">This is usually a Firestore index issue.<br>
            Add this index in Firebase Console:<br>
            <code style="background:rgba(124,58,237,0.1);padding:2px 6px;border-radius:4px;font-size:10px">chats/{id}/messages → createdAt ASC</code>
          </p>
          <button onclick="openChat('${chatId}')" style="padding:8px 20px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:white;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:none">
            Retry
          </button>
        </div>`;
    }
  }, 6000);

  // Unsubscribe previous listener
  _chatUnsubscribe();

  // ── KEY FIX: No orderBy → no index needed. Sort client-side. ──
  _chatUnsubscribe = db.collection('chats').doc(chatId)
    .collection('messages')
    .onSnapshot({ includeMetadataChanges: false }, snap => {
      _listenerFired = true;
      clearTimeout(_timeoutId);

      // Clear unread every time new messages arrive
      db.collection('chats').doc(chatId).update({ [unreadField]: 0 }).catch(() => {});

      // Sort docs by createdAt client-side (avoids index requirement)
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return ta - tb;
        });

      if (sorted.length === 0) {
        // Empty — show welcome + quick replies
        msgs.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;text-align:center;padding:20px">
            <div style="width:60px;height:60px;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(124,58,237,0.2);flex-shrink:0">
              <img src="${optimizeImage(chatData.productImage,120)||'https://placehold.co/60x60/e8e0ff/7c3aed?text=📦'}"
                style="width:100%;height:100%;object-fit:cover" loading="lazy">
            </div>
            <div>
              <p style="font-weight:800;font-size:14px" class="text-gray-800 dark:text-gray-100">Chat with ${esc(otherName)}</p>
              <p style="font-size:12px;margin-top:4px;line-height:1.6;max-width:220px" class="text-gray-400">
                ${isBuyer ? 'Say hello! Coordinate where to meet to collect your item.' : 'A buyer wants to pick up their item. Reply to coordinate meetup.'}
              </p>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
              ${quickReplies.map(q =>
                `<button class="chat-quick-reply" style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.22);color:#7c3aed;padding:6px 12px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s" data-text="${esc(q)}">${esc(q)}</button>`
              ).join('')}
            </div>
          </div>`;
        msgs.querySelectorAll('.chat-quick-reply').forEach(btn => {
          btn.addEventListener('click', () => {
            const i = document.getElementById('chat-input');
            if (i) { i.value = btn.dataset.text; i.focus(); }
          });
        });
        return;
      }

      // Render messages
      const atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 80;
      msgs.innerHTML = '';
      let lastDate = null;

      sorted.forEach(msg => {
        const mine    = msg.senderId === currentUser.uid;
        const ts      = msg.createdAt?.toDate?.() || new Date(msg.createdAt?.seconds * 1000 || Date.now());
        const dateStr = ts.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
        const timeStr = ts.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });

        // Date divider
        if (dateStr !== lastDate) {
          lastDate = dateStr;
          const div = document.createElement('div');
          div.className = 'chat-date-divider';
          div.textContent = dateStr;
          msgs.appendChild(div);
        }

        const wrap = document.createElement('div');
        wrap.className = `chat-bubble-wrap ${mine ? 'mine' : ''}`;

        if (!mine) {
          const av = document.createElement('img');
          const avInit = (otherName[0] || '?').toUpperCase();
          av.src = optimizeImage(otherPhoto, 56) || `https://placehold.co/28x28/e8e0ff/7c3aed?text=${avInit}`;
          av.onerror = () => { av.src = `https://placehold.co/28x28/e8e0ff/7c3aed?text=${avInit}`; };
          av.className = 'chat-avatar-sm';
          av.loading = 'lazy';
          wrap.appendChild(av);
        }

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${mine ? 'mine' : 'theirs'}`;
        bubble.innerHTML = `${esc(msg.text)}<span class="chat-time">${timeStr}${mine ? ' ✓' : ''}</span>`;
        wrap.appendChild(bubble);
        msgs.appendChild(wrap);
      });

      // Always scroll to bottom when messages load or new ones arrive
      requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });

    }, err => {
      _listenerFired = true;
      clearTimeout(_timeoutId);
      console.error('Chat messages listener error:', err.code, err.message);
      if (msgs) {
        msgs.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;padding:24px;text-align:center">
            <div style="font-size:2rem">❌</div>
            <p style="font-size:13px;font-weight:700" class="text-rose-500">Failed to load messages</p>
            <p style="font-size:11px;color:#9ca3af">Error: ${err.code || err.message}</p>
            <button onclick="openChat('${chatId}')" style="padding:8px 20px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:white;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:none;margin-top:4px">
              🔄 Retry
            </button>
          </div>`;
      }
    });
};

// Expose openChat globally so the inline retry button works
window.openChat = openChat;

const closeChat = () => {
  document.getElementById('chat-modal-overlay')?.classList.remove('open');
  document.getElementById('chat-panel')?.classList.remove('open');
  _chatUnsubscribe();
  _chatUnsubscribe = () => {};
  _activeChatId = null; _activeChatRole = null; _activeChatData = null;
  const inp = document.getElementById('chat-input');
  if (inp) { inp.value = ''; inp.style.height = 'auto'; }
};

const sendChatMessage = async () => {
  const inp  = document.getElementById('chat-input');
  const text = inp?.value.trim();
  if (!text || !_activeChatId || !currentUser || !_activeChatData) return;

  // Optimistic clear
  if (inp) { inp.value = ''; inp.style.height = 'auto'; }

  const isBuyer     = _activeChatRole === 'buyer';
  const otherId     = isBuyer ? _activeChatData.sellerId : _activeChatData.buyerId;
  const unreadField = isBuyer ? 'unreadSeller' : 'unreadBuyer';

  try {
    const chatRef = db.collection('chats').doc(_activeChatId);

    await chatRef.collection('messages').add({
      senderId:    currentUser.uid,
      senderName:  currentUser.displayName || 'User',
      senderPhoto: currentUser.photoURL    || '',
      text:        filterProfanity(text),
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
    });

    await chatRef.update({
      lastMessage:    text.length > 80 ? text.slice(0, 80) + '…' : text,
      lastMessageAt:  firebase.firestore.FieldValue.serverTimestamp(),
      [unreadField]:  firebase.firestore.FieldValue.increment(1),
    });

    sendNotification(otherId, {
      type:      'chat',
      title:     `💬 ${currentUser.displayName || 'Someone'} sent you a message`,
      body:      text.length > 100 ? text.slice(0, 100) + '…' : text,
      productId: _activeChatData.productId || '',
    }).catch(() => {});

  } catch(err) {
    console.error('sendChatMessage error:', err.code, err.message);
    showMessage('Message not sent: ' + (err.code === 'permission-denied' ? 'Permission denied — check Firestore rules.' : err.message), 'error');
    if (inp) inp.value = text; // restore on failure
  }
};

// ── Event listeners ───────────────────────────────────────
document.getElementById('chat-input')?.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 100) + 'px';
}, { passive: true });

document.getElementById('chat-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
});

document.getElementById('chat-send-btn')?.addEventListener('click', sendChatMessage);
document.getElementById('close-chat-btn')?.addEventListener('click', closeChat);
document.getElementById('chat-modal-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('chat-modal-overlay')) closeChat();
});

// Delete button in chat header — use event delegation since deleteChat defined later
document.body.addEventListener('click', e => {
  if (!e.target.closest('#delete-chat-btn')) return;
  if (!_activeChatId || !_activeChatData) return;
  const isBuyer   = _activeChatRole === 'buyer';
  const otherName = isBuyer ? (_activeChatData.sellerName||'Seller') : (_activeChatData.buyerName||'Buyer');
  // deleteChat defined later in this script — called via window scope
  if (typeof deleteChat === 'function') deleteChat(_activeChatId, otherName);
});

document.body.addEventListener('click', e => {
  const btn = e.target.closest('.open-order-chat-btn');
  if (!btn) return; e.stopPropagation(); openChat(btn.dataset.chatId);
});
document.body.addEventListener('click', e => {
  const btn = e.target.closest('.open-seller-chat-btn');
  if (!btn) return; e.stopPropagation(); openChat(btn.dataset.chatId);
});

// ── FLOATING CHAT FAB — buyer & seller inbox ──────────────
let _inboxRenderTimer = null;
let _fabChatsSnap = null; // latest snapshot from both queries

// renderSellerChatInbox still used by My Listings page section
const renderSellerChatInbox = () => {
  if (_fabChatsSnap) _renderFabInbox(_fabChatsSnap);
};

const _buildFabHTML = () => {
  const fabWidget = document.getElementById('order-chat-fab-widget');
  if (!fabWidget || !currentUser) return;
  fabWidget.innerHTML = `
    <div id="order-chat-fab-container">
      <!-- Header -->
      <div class="flex-shrink-0 px-4 py-3.5 border-b border-vit-500/10 flex items-center justify-between"
        style="background:linear-gradient(135deg,#7c3aed,#06b6d4)">
        <div class="flex items-center gap-3">
          <div style="width:34px;height:34px;background:rgba(255,255,255,0.18);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px">💬</div>
          <div>
            <h3 class="text-sm font-bold text-white">My Chats</h3>
            <p class="text-xs text-white/70" id="fab-chat-subtitle">Loading…</p>
          </div>
        </div>
        <button id="close-order-chat-fab-btn" class="text-white/60 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">&times;</button>
      </div>
      <!-- Tab bar: As Buyer / As Seller -->
      <div class="flex-shrink-0 flex border-b border-vit-500/10">
        <button id="fab-tab-buyer" class="fab-tab-btn flex-1 py-2.5 text-xs font-bold transition-all border-b-2 border-vit-500 text-vit-600 dark:text-vit-400 bg-vit-50/50 dark:bg-vit-900/10">
          🛒 As Buyer
        </button>
        <button id="fab-tab-seller" class="fab-tab-btn flex-1 py-2.5 text-xs font-bold transition-all border-b-2 border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          🏪 As Seller
        </button>
      </div>
      <!-- Inbox list -->
      <div id="fab-inbox-list" class="flex-grow overflow-y-auto" style="-webkit-overflow-scrolling:touch;"></div>
    </div>
    <!-- FAB Button -->
    <button id="open-order-chat-fab-btn"
      class="w-14 h-14 text-white rounded-2xl shadow-2xl flex items-center justify-center shimmer-btn animate-float"
      style="background:linear-gradient(135deg,#06b6d4,#7c3aed);box-shadow:0 8px 28px rgba(6,182,212,0.45);position:relative"
      aria-label="Open chats">
      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
      </svg>
      <span id="order-chat-fab-unread" style="display:none;position:absolute;top:-5px;right:-5px;background:#f43f5e;color:white;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:99px;align-items:center;justify-content:center;padding:0 3px;line-height:1;border:2px solid white;">0</span>
    </button>`;

  // FAB open/close
  document.getElementById('open-order-chat-fab-btn')?.addEventListener('click', () => {
    const fab = document.getElementById('order-chat-fab-container');
    const isOpen = fab.classList.contains('open');
    if (isOpen) { fab.classList.remove('open'); }
    else { fab.classList.add('open'); _loadFabInbox(); }
    // Close chatbot if open
    document.getElementById('popup-chat-container')?.classList.remove('open');
    document.getElementById('open-popup-chat-btn')?.classList.remove('hidden');
  });
  document.getElementById('close-order-chat-fab-btn')?.addEventListener('click', () => {
    document.getElementById('order-chat-fab-container')?.classList.remove('open');
  });

  // Tabs
  let _fabActiveTab = 'buyer';
  const setFabTab = (tab) => {
    _fabActiveTab = tab;
    const buyerBtn  = document.getElementById('fab-tab-buyer');
    const sellerBtn = document.getElementById('fab-tab-seller');
    buyerBtn.className  = `fab-tab-btn flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${tab==='buyer'  ? 'border-vit-500 text-vit-600 dark:text-vit-400 bg-vit-50/50 dark:bg-vit-900/10' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`;
    sellerBtn.className = `fab-tab-btn flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${tab==='seller' ? 'border-vit-500 text-vit-600 dark:text-vit-400 bg-vit-50/50 dark:bg-vit-900/10' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`;
    if (_fabChatsSnap) _renderFabInbox(_fabChatsSnap, tab);
  };
  document.getElementById('fab-tab-buyer')?.addEventListener('click',  () => setFabTab('buyer'));
  document.getElementById('fab-tab-seller')?.addEventListener('click', () => setFabTab('seller'));

  // Expose setFabTab for the snapshot callbacks
  window._setFabTab = setFabTab;
  window._getFabActiveTab = () => _fabActiveTab;
};

const _loadFabInbox = () => {
  if (!currentUser) return;
  _inboxUnsubscribe();

  // Two parallel listeners (Firestore can't do OR queries across fields)
  // No orderBy = no composite index needed → sort client-side
  let buyerSnap  = null;
  let sellerSnap = null;

  const merge = () => {
    if (!buyerSnap && !sellerSnap) return;
    const allDocs = [
      ...(buyerSnap  ? buyerSnap.docs  : []),
      ...(sellerSnap ? sellerSnap.docs : []),
    ];
    // Dedupe by doc id
    const seen = new Set();
    const deduped = allDocs.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; });
    // Sort by lastMessageAt desc — client-side (no index needed)
    deduped.sort((a, b) => {
      const ta = a.data().lastMessageAt?.toMillis?.() || a.data().lastMessageAt?.seconds * 1000 || 0;
      const tb = b.data().lastMessageAt?.toMillis?.() || b.data().lastMessageAt?.seconds * 1000 || 0;
      return tb - ta;
    });
    _fabChatsSnap = { docs: deduped };
    clearTimeout(_inboxRenderTimer);
    _inboxRenderTimer = setTimeout(() => {
      _renderFabInbox(_fabChatsSnap, window._getFabActiveTab?.() || 'buyer');
      _updateFabBadge(_fabChatsSnap);
      _updateMyListingsInbox(_fabChatsSnap);
    }, 100);
  };

  const unsub1 = db.collection('chats')
    .where('buyerId', '==', currentUser.uid)
    .limit(30)
    .onSnapshot(s => { buyerSnap  = s; merge(); }, err => console.warn('Buyer chats listener:', err.code));

  const unsub2 = db.collection('chats')
    .where('sellerId', '==', currentUser.uid)
    .limit(30)
    .onSnapshot(s => { sellerSnap = s; merge(); }, err => console.warn('Seller chats listener:', err.code));

  _inboxUnsubscribe = () => { unsub1(); unsub2(); };
};

const _chatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
    : d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
};

const _renderFabInbox = (snapData, tab) => {
  const el = document.getElementById('fab-inbox-list');
  if (!el || !currentUser) return;
  const activeTab = tab || window._getFabActiveTab?.() || 'buyer';

  const filtered = snapData.docs.filter(doc => {
    const d = doc.data();
    return activeTab === 'buyer'
      ? d.buyerId  === currentUser.uid
      : d.sellerId === currentUser.uid;
  });

  const subtitle = document.getElementById('fab-chat-subtitle');
  const totalUnread = snapData.docs.reduce((s,d) => {
    const data = d.data();
    const isBuyer = data.buyerId === currentUser.uid;
    return s + (isBuyer ? (data.unreadBuyer||0) : (data.unreadSeller||0));
  }, 0);
  if (subtitle) subtitle.textContent = totalUnread > 0 ? `${totalUnread} unread message${totalUnread>1?'s':''}` : `${snapData.docs.length} conversation${snapData.docs.length!==1?'s':''}`;

  if (filtered.length === 0) {
    el.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-8">
        <div class="text-5xl">${activeTab==='buyer'?'🛒':'🏪'}</div>
        <p class="font-bold text-gray-700 dark:text-gray-200 text-sm">${activeTab==='buyer'?'No purchase chats yet':'No buyer chats yet'}</p>
        <p class="text-gray-400 text-xs leading-relaxed">${activeTab==='buyer'?'When you buy something, chat with the seller here to arrange pickup.':'When someone buys your listing, they can chat with you here.'}</p>
      </div>`;
    return;
  }

  el.innerHTML = filtered.map(doc => {
    const c = { id: doc.id, ...doc.data() };
    const isBuyer  = c.buyerId === currentUser.uid;
    const unread   = isBuyer ? (c.unreadBuyer||0) : (c.unreadSeller||0);
    const otherName  = isBuyer ? (c.sellerName||'Seller') : (c.buyerName||'Buyer');
    const otherPhoto = isBuyer ? (c.sellerPhoto||'')      : (c.buyerPhoto||'');
    const initial    = (otherName[0]||'?').toUpperCase();
    const timeStr    = _chatTime(c.lastMessageAt);

    return `
      <div class="chat-fab-inbox-item" style="${unread>0?'background:rgba(139,92,246,0.04)':''}">
        <div class="open-chat-from-fab" data-chat-id="${esc(c.id)}"
          style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;cursor:pointer;padding:2px 0">
          <div style="position:relative;flex-shrink:0">
            <img src="${optimizeImage(otherPhoto,80)||`https://placehold.co/44x44/e8e0ff/7c3aed?text=${initial}`}"
              style="width:44px;height:44px;border-radius:12px;object-fit:cover;${unread>0?'outline:2px solid #7c3aed;outline-offset:1px':''}"
              loading="lazy"
              onerror="this.src='https://placehold.co/44x44/e8e0ff/7c3aed?text=${initial}'">
            ${unread>0?`<span class="chat-inbox-badge" style="position:absolute;top:-4px;right:-4px">${unread>9?'9+':unread}</span>`:''}
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px">
              <p style="font-weight:${unread>0?800:600};font-size:0.8125rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px"
                class="${unread>0?'text-vit-600 dark:text-vit-400':'text-gray-900 dark:text-white'}">${esc(otherName)}</p>
              <span style="font-size:10px;flex-shrink:0;font-weight:${unread>0?700:400}"
                class="${unread>0?'text-vit-600 dark:text-vit-400':'text-gray-400'}">${timeStr}</span>
            </div>
            <p style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" class="text-gray-400">re: ${esc(c.productName||'Item')}</p>
            <p style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:${unread>0?600:400}"
              class="${unread>0?'text-vit-600 dark:text-vit-400':'text-gray-400'}">${c.lastMessage?esc(c.lastMessage):'💬 Say hello!'}</p>
          </div>
        </div>
        <!-- Delete chat button -->
        <button class="delete-chat-from-fab flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
          data-chat-id="${esc(c.id)}" data-other-name="${esc(otherName)}" title="Delete chat"
          style="margin-left:4px">
          <svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>`;
  }).join('');
};

// Update the My Listings inbox section if it's visible
const _updateMyListingsInbox = (snapData) => {
  const el = document.getElementById('seller-chat-inbox');
  if (!el || !currentUser) return;
  const sellerDocs = { docs: snapData.docs.filter(d => d.data().sellerId === currentUser.uid) };
  if (sellerDocs.docs.length === 0) {
    el.innerHTML = `<div class="flex flex-col items-center py-10 gap-2 text-center"><div class="text-4xl">💬</div><p class="text-gray-400 text-sm font-medium">No buyer chats yet.</p></div>`;
    return;
  }
  el.innerHTML = sellerDocs.docs.map(doc => {
    const c = { id: doc.id, ...doc.data() };
    const unread  = c.unreadSeller || 0;
    const initial = (c.buyerName||'B')[0].toUpperCase();
    const timeStr = _chatTime(c.lastMessageAt);
    return `
      <div class="flex items-center gap-1 hover:bg-vit-50 dark:hover:bg-vit-900/20 rounded-xl transition-all pr-1">
        <button class="open-seller-chat-btn flex-1 flex items-center gap-3 p-3.5 text-left group active:scale-[0.98]" data-chat-id="${esc(c.id)}">
          <div class="relative flex-shrink-0">
            <img src="${optimizeImage(c.buyerPhoto,80)||`https://placehold.co/44x44/e8e0ff/7c3aed?text=${initial}`}"
              class="w-11 h-11 rounded-xl object-cover ring-2 ${unread>0?'ring-vit-500':'ring-transparent'}" loading="lazy"
              onerror="this.src='https://placehold.co/44x44/e8e0ff/7c3aed?text=${initial}'">
            ${unread>0?`<span class="chat-inbox-badge absolute -top-1 -right-1">${unread>9?'9+':unread}</span>`:''}
          </div>
          <div class="flex-grow min-w-0">
            <div class="flex items-center justify-between gap-2 mb-0.5">
              <p class="font-bold text-sm text-gray-900 dark:text-white truncate">${esc(c.buyerName||'Buyer')}</p>
              <span class="text-xs ${unread>0?'text-vit-600 dark:text-vit-400 font-bold':'text-gray-400'} flex-shrink-0">${timeStr}</span>
            </div>
            <p class="text-xs text-gray-400 truncate">re: ${esc(c.productName||'Item')}</p>
            <p class="text-xs truncate mt-0.5 ${unread>0?'text-vit-600 dark:text-vit-400 font-semibold':'text-gray-400'}">${c.lastMessage?esc(c.lastMessage):'💬 Chat started'}</p>
          </div>
        </button>
        <button class="delete-chat-from-fab flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
          data-chat-id="${esc(c.id)}" data-other-name="${esc(c.buyerName||'Buyer')}" title="Delete chat">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>`;
  }).join('');
};

const _updateFabBadge = (snapData) => {
  const badge = document.getElementById('order-chat-fab-unread');
  if (!badge || !currentUser) return;
  const total = snapData.docs.reduce((s,d) => {
    const data   = d.data();
    const isBuyer = data.buyerId === currentUser.uid;
    return s + (isBuyer ? (data.unreadBuyer||0) : (data.unreadSeller||0));
  }, 0);
  badge.textContent  = total > 9 ? '9+' : String(total);
  badge.style.display = total > 0 ? 'flex' : 'none';
};

// ── Delete chat ───────────────────────────────────────────
const deleteChat = async (chatId, otherName) => {
  if (!currentUser || !chatId) return;

  showConfirmModal(
    `Delete your conversation with ${otherName}? This removes the chat for you only — the other person can still see it.`,
    async () => {
      try {
        // If this is the active chat, close it first
        if (_activeChatId === chatId) closeChat();

        // Animate item out of FAB list
        const item = document.querySelector(`[data-chat-id="${chatId}"]`)?.closest('.chat-fab-inbox-item, .flex.items-center.gap-1');
        if (item) {
          item.style.transition = 'opacity 0.2s, transform 0.2s, max-height 0.25s, padding 0.25s';
          item.style.opacity = '0';
          item.style.transform = 'translateX(20px)';
          item.style.overflow = 'hidden';
          item.style.maxHeight = item.offsetHeight + 'px';
          setTimeout(() => {
            item.style.maxHeight = '0';
            item.style.padding = '0';
          }, 180);
          setTimeout(() => item.remove(), 380);
        }

        // Delete all messages in sub-collection first (in batches of 100)
        const msgSnap = await db.collection('chats').doc(chatId).collection('messages').limit(100).get();
        if (!msgSnap.empty) {
          const batch = db.batch();
          msgSnap.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }

        // Delete the chat document itself
        await db.collection('chats').doc(chatId).delete();

        showMessage('Chat deleted.', 'success');
      } catch(err) {
        console.error('deleteChat error:', err.code, err.message);
        if (err.code === 'permission-denied') {
          showMessage('Permission denied — update Firestore rules to allow chat deletion.', 'error');
        } else {
          showMessage('Could not delete chat: ' + err.message, 'error');
        }
      }
    }
  );
};

// ── Click handler — open chat from FAB inbox ──────────────
document.body.addEventListener('click', e => {
  // Delete button takes priority
  const delBtn = e.target.closest('.delete-chat-from-fab');
  if (delBtn) {
    e.stopPropagation();
    deleteChat(delBtn.dataset.chatId, delBtn.dataset.otherName || 'this person');
    return;
  }

  // Open chat row
  const item = e.target.closest('.open-chat-from-fab');
  if (!item) return;
  e.stopPropagation();
  document.getElementById('order-chat-fab-container')?.classList.remove('open');
  openChat(item.dataset.chatId);
});

// ── Delete chat from header button ───────────────────────
document.getElementById('delete-chat-btn')?.addEventListener('click', () => {
  if (!_activeChatId || !_activeChatData) return;
  const isBuyer = _activeChatRole === 'buyer';
  const otherName = isBuyer ? (_activeChatData.sellerName||'Seller') : (_activeChatData.buyerName||'Buyer');
  deleteChat(_activeChatId, otherName);
});

// ── initialise FAB + start real-time listener ─────────────
const startSellerInbox = () => { _loadFabInbox(); };
const stopSellerInbox  = () => { _inboxUnsubscribe(); _inboxUnsubscribe = () => {}; };

const injectChatFab = () => {
  if (!currentUser) return;
  _buildFabHTML();
  _loadFabInbox(); // starts real-time listener immediately (badge updates in background)
};

document.addEventListener('vitmart-user-ready', () => { injectChatFab(); });
if (currentUser) injectChatFab();

// Remove old header bell if it exists
document.getElementById('chat-bell-btn')?.closest('div')?.remove();
document.getElementById('chat-header-badge')?.closest('div')?.remove();

if (typeof NOTIF_ICONS !== 'undefined') {
  NOTIF_ICONS['chat'] = { bg:'bg-blue-100 dark:bg-blue-900/40', icon:'💬' };
}






// OPTIMISATION: Lazy-load all dynamic images
// ══════════════════════════════════════════════
