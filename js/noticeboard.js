let noticeUnsubscribe = () => {};
let currentNoticeRepliesUnsubs = {};

const NOTICE_TAGS = {
  'want-to-buy': { label:'Want to Buy', cls:'tag-want', icon:'🛒' },
  'selling':     { label:'Selling',     cls:'tag-sell', icon:'💰' },
  'help':        { label:'Need Help',   cls:'tag-help', icon:'🙋' },
  'general':     { label:'General',     cls:'tag-general', icon:'📢' }
};

const renderNoticeboardPage = () => {
  if (!currentUser) { showMessage('Sign in to view the noticeboard.','error'); setActiveTab('home'); return; }
  const c = document.getElementById('noticeboard-tab');
  c.innerHTML = `
    ${getBackButtonHTML()}
    <div class="mb-8">
      <p class="section-eyebrow mb-2">Community Board</p>
      <h2 class="text-4xl font-black text-gray-900 dark:text-white">📌 Notice <span class="grad-text">Board</span></h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Post what you need, what you're selling, or ask for help — the campus sees it in real time</p>
    </div>

    <!-- Post Form -->
    <div class="glass rounded-2xl p-6 mb-8 border border-vit-500/20">
      <h3 class="text-lg font-black text-gray-900 dark:text-white mb-4">📝 Post a Notice</h3>
      <form id="notice-form" class="space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="notice-tag-selector">
          ${Object.entries(NOTICE_TAGS).map(([k,v]) => `
            <label class="notice-tag-radio cursor-pointer">
              <input type="radio" name="notice-tag" value="${k}" class="hidden" ${k==='general'?'checked':''}>
              <div class="notice-tag-btn p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-center transition-all hover:border-vit-400 hover:bg-vit-50 dark:hover:bg-vit-900/20">
                <div class="text-xl mb-1">${v.icon}</div>
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300">${v.label}</div>
              </div>
            </label>`).join('')}
        </div>
        <input type="text" id="notice-title" class="vit-input" placeholder="Title of your notice *" required maxlength="100">
        <textarea id="notice-body" class="vit-input resize-none" rows="3" placeholder="Details — be specific! (e.g. 'Looking for a 2nd-hand MTech thermo book, budget ₹200') *" required maxlength="500"></textarea>
        <div class="flex items-center justify-between">
          <span id="notice-char-count" class="text-xs text-gray-400">0 / 500</span>
          <button type="submit" class="px-6 py-2.5 bg-gradient-to-r from-vit-600 to-cyan-500 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30 hover:-translate-y-0.5 transition-transform">
            Post Notice 📌
          </button>
        </div>
      </form>
    </div>

    <!-- Filter pills -->
    <div class="flex flex-wrap gap-2 mb-6" id="notice-filter-bar">
      <button class="cat-pill active" data-filter="all">All Posts</button>
      ${Object.entries(NOTICE_TAGS).map(([k,v])=>`<button class="cat-pill" data-filter="${k}">${v.icon} ${v.label}</button>`).join('')}
    </div>

    <!-- Live feed -->
    <div id="notice-feed" class="space-y-4">
      <div class="text-center py-12 text-gray-400">Loading notices…</div>
    </div>`;

  // char counter
  const bodyTa = c.querySelector('#notice-body');
  const charCnt = c.querySelector('#notice-char-count');
  bodyTa.addEventListener('input', () => { charCnt.textContent = `${bodyTa.value.length} / 500`; });

  // tag selector styling
  const tagRadios = c.querySelectorAll('.notice-tag-radio');
  const highlightSelected = () => {
    tagRadios.forEach(label => {
      const inp = label.querySelector('input');
      const btn = label.querySelector('.notice-tag-btn');
      if (inp.checked) {
        btn.classList.add('border-vit-500','bg-vit-50','dark:bg-vit-900/20','shadow-lg');
      } else {
        btn.classList.remove('border-vit-500','bg-vit-50','dark:bg-vit-900/20','shadow-lg');
      }
    });
  };
  tagRadios.forEach(label => { label.addEventListener('change', highlightSelected); });
  highlightSelected();

  // filter
  let activeNoticeFilter = 'all';
  let allNotices = [];
  c.querySelector('#notice-filter-bar').addEventListener('click', e => {
    const btn = e.target.closest('.cat-pill');
    if (!btn) return;
    c.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeNoticeFilter = btn.dataset.filter;
    renderNoticeFeed(allNotices, activeNoticeFilter);
  });

  // live listener
  noticeUnsubscribe();
  noticeUnsubscribe = db.collection('noticeboard').orderBy('createdAt','desc').limit(60).onSnapshot(snap => {
    allNotices = snap.docs.map(d => ({id:d.id,...d.data()}));
    renderNoticeFeed(allNotices, activeNoticeFilter);
  });

  // submit
  c.querySelector('#notice-form').addEventListener('submit', async e => {
    e.preventDefault();
    const tag = c.querySelector('input[name="notice-tag"]:checked')?.value || 'general';
    const title = c.querySelector('#notice-title').value.trim();
    const body = filterProfanity(c.querySelector('#notice-body').value.trim());
    if (!title || !body) return;
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.innerHTML = `<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
    try {
      await db.collection('noticeboard').add({
        tag, title, body,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Student',
        authorPhoto: currentUser.photoURL || null,
        replyCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showMessage('Notice posted! 📌', 'success');
      e.target.reset(); charCnt.textContent = '0 / 500'; highlightSelected();
    } catch(err) { showMessage('Error: '+err.message,'error'); }
    finally { btn.disabled=false; btn.innerHTML='Post Notice 📌'; }
  });
};

const renderNoticeFeed = (notices, filter='all') => {
  const feed = document.getElementById('notice-feed');
  if (!feed) return;
  const list = filter==='all' ? notices : notices.filter(n => n.tag===filter);
  if (list.length===0) {
    feed.innerHTML=`<div class="text-center py-16 text-gray-400"><div class="text-5xl mb-3">📌</div><p class="font-medium">No notices yet. Be the first to post!</p></div>`;
    return;
  }
  feed.innerHTML = list.map(n => {
    const tag = NOTICE_TAGS[n.tag] || NOTICE_TAGS.general;
    const initials = (n.authorName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const avatar = n.authorPhoto
      ? `<img src="${n.authorPhoto}" class="w-9 h-9 rounded-xl object-cover flex-shrink-0">`
      : `<div class="w-9 h-9 rounded-xl bg-gradient-to-br from-vit-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">${initials}</div>`;
    const canDelete = currentUser && n.authorId===currentUser.uid;
    const ts = n.createdAt ? timeAgoStr(n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt)) : 'just now';
    return `
    <div class="notice-card" data-notice-id="${n.id}">
      <div class="p-5">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            ${avatar}
            <div>
              <p class="font-bold text-sm text-gray-900 dark:text-white">${esc(n.authorName)}</p>
              <p class="text-xs text-gray-400">${ts}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="notice-tag ${tag.cls}">${tag.icon} ${tag.label}</span>
            ${canDelete?`<button class="delete-notice-btn text-gray-300 hover:text-rose-500 transition-colors p-1 rounded-lg" data-id="${n.id}" title="Delete"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>`:''}
          </div>
        </div>
        <h3 class="font-black text-gray-900 dark:text-white text-base mb-1">${esc(n.title)}</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">${esc(n.body)}</p>
        <div class="mt-4 flex items-center gap-3">
          <button class="expand-replies-btn reply-count-chip ${(n.replyCount||0)>0?'has-replies':''} flex items-center gap-1.5 text-xs font-bold hover:opacity-80 transition-all" data-notice-id="${n.id}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <span id="reply-count-${n.id}">${(n.replyCount||0)>0 ? `${n.replyCount} ${n.replyCount===1?'reply':'replies'}` : 'Reply'}</span>
          </button>

        </div>
      </div>
      <!-- Replies section -->
      <div class="replies-container replies-panel" id="replies-container-${n.id}">
        <div id="replies-list-${n.id}" class="px-5 pt-3 space-y-2"></div>
        <div class="reply-input-row">
          <input type="text" class="reply-input vit-input flex-grow" placeholder="Write a reply…" maxlength="300" data-notice-id="${n.id}">
          <button type="button" class="reply-submit-btn" data-notice-id="${n.id}" title="Send reply">
            <svg fill="currentColor" viewBox="0 0 20 20" transform="rotate(90)"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Expand/collapse replies
  feed.querySelectorAll('.expand-replies-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const nid = btn.dataset.noticeId;
      const container = document.getElementById(`replies-container-${nid}`);
      const isOpen = container.classList.contains('open');
      // Haptic-feel: scale the button briefly
      btn.style.transform = 'scale(0.9)';
      requestAnimationFrame(() => { btn.style.transform = ''; });
      if (isOpen) {
        container.classList.remove('open');
        if (currentNoticeRepliesUnsubs[nid]) { currentNoticeRepliesUnsubs[nid](); delete currentNoticeRepliesUnsubs[nid]; }
      } else {
        container.classList.add('open');
        listenReplies(nid);
        // Focus the input after animation
        setTimeout(() => {
          const inp = document.querySelector(`.reply-input[data-notice-id="${nid}"]`);
          inp?.focus();
        }, 260);
      }
    });
  });

  // Reply submit buttons (new button-based UI)
  const submitReply = async (nid, inp, btn) => {
    const text = filterProfanity(inp.value.trim());
    if (!text) { inp.focus(); return; }
    const origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    try {
      const batch = db.batch();
      const replyRef = db.collection('noticeboard').doc(nid).collection('replies').doc();
      batch.set(replyRef, {
        text, authorId: currentUser.uid, authorName: currentUser.displayName||'Student',
        authorPhoto: currentUser.photoURL||null, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      batch.update(db.collection('noticeboard').doc(nid), { replyCount: firebase.firestore.FieldValue.increment(1) });
      await batch.commit();
      inp.value = '';
      // Update count chip immediately (optimistic)
      const countEl = document.getElementById(`reply-count-${nid}`);
      const countBtn = document.querySelector(`.expand-replies-btn[data-notice-id="${nid}"]`);
      if (countBtn) countBtn.classList.add('has-replies');
    } catch(err) { showMessage('Error: '+err.message,'error'); }
    finally { btn.disabled=false; btn.innerHTML=origHTML; }
  };

  feed.querySelectorAll('.reply-submit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const nid = btn.dataset.noticeId;
      const inp = feed.querySelector(`.reply-input[data-notice-id="${nid}"]`);
      if (inp) submitReply(nid, inp, btn);
    });
  });

  // Also submit on Enter key in reply input
  feed.querySelectorAll('.reply-input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const nid = inp.dataset.noticeId;
        const btn = feed.querySelector(`.reply-submit-btn[data-notice-id="${nid}"]`);
        if (btn) submitReply(nid, inp, btn);
      }
    });
    // Auto-open replies section when user starts typing
    inp.addEventListener('focus', () => {
      const nid = inp.dataset.noticeId;
      const container = document.getElementById(`replies-container-${nid}`);
      if (container && !container.classList.contains('open')) {
        container.classList.add('open');
        listenReplies(nid);
      }
    });
  });

  // Delete notice
  feed.querySelectorAll('.delete-notice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirmModal('Delete this notice?', async () => {
        try { await db.collection('noticeboard').doc(btn.dataset.id).delete(); showMessage('Deleted.','success'); }
        catch(err) { showMessage('Error.','error'); }
      });
    });
  });

};

const listenReplies = (noticeId) => {
  if (currentNoticeRepliesUnsubs[noticeId]) return;
  const listEl = document.getElementById(`replies-list-${noticeId}`);
  if (!listEl) return;
  currentNoticeRepliesUnsubs[noticeId] = db.collection('noticeboard').doc(noticeId)
    .collection('replies').orderBy('createdAt','asc').limit(30)
    .onSnapshot(snap => {
      if (!snap.docs.length) { listEl.innerHTML=`<p class="text-xs text-gray-400">No replies yet. Be the first!</p>`; return; }
      listEl.innerHTML = snap.docs.map((d, i) => {
        const r = d.data();
        const initials = (r.authorName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
        const av = r.authorPhoto
          ? `<img src="${r.authorPhoto}" class="w-7 h-7 rounded-lg object-cover flex-shrink-0">`
          : `<div class="w-7 h-7 rounded-lg bg-gradient-to-br from-vit-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">${initials}</div>`;
        const ts = r.createdAt ? timeAgoStr(r.createdAt.toDate ? r.createdAt.toDate() : new Date()) : '';
        const mine = r.authorId === currentUser?.uid;
        return `<div class="reply-bubble flex items-start gap-2" style="opacity:0;transform:translateY(4px);animation:reply-in 0.18s ease forwards;animation-delay:${i*40}ms">
          ${av}
          <div class="flex-grow min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs text-gray-800 dark:text-gray-200">${esc(r.authorName)}</span>
              <span class="text-xs text-gray-400">${ts}</span>
              ${mine ? `<button class="delete-reply-btn text-gray-300 hover:text-rose-500 transition-colors ml-auto text-xs" data-notice-id="${noticeId}" data-reply-id="${d.id}">✕</button>` : ''}
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">${esc(r.text)}</p>
          </div>
        </div>`;
      }).join('');
      // delete reply handlers
      listEl.querySelectorAll('.delete-reply-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const batch = db.batch();
            batch.delete(db.collection('noticeboard').doc(btn.dataset.noticeId).collection('replies').doc(btn.dataset.replyId));
            batch.update(db.collection('noticeboard').doc(btn.dataset.noticeId), { replyCount: firebase.firestore.FieldValue.increment(-1) });
            await batch.commit();
          } catch(err) { showMessage('Error.','error'); }
        });
      });
    });
};

// ═══════════════════════════════════════════════════════════
// ░░░  PRICE NEGOTIATION  ░░░
// ═══════════════════════════════════════════════════════════
