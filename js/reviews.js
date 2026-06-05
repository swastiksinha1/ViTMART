const starsHTML = (rating, interactive=false, productId='') => {
  if (interactive) {
    return `<div class="flex gap-1" id="star-input">
      ${[1,2,3,4,5].map(i=>`<button type="button" class="star-btn" data-val="${i}" aria-label="${i} star">★</button>`).join('')}
    </div>`;
  }
  return [1,2,3,4,5].map(i=>`<span class="star-display ${i<=rating?'':'empty'}">★</span>`).join('');
};

const renderReviewsPage = () => {
  if (!currentUser) { showMessage('Sign in to view reviews.','error'); setActiveTab('home'); return; }
  const c = document.getElementById('reviews-tab');
  c.innerHTML = `
    ${getBackButtonHTML()}
    <div class="mb-8">
      <p class="section-eyebrow mb-2">Community Feedback</p>
      <h2 class="text-4xl font-black text-gray-900 dark:text-white">Campus <span class="grad-text">Reviews</span></h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Real experiences from real students</p>
    </div>

    <!-- Write Review -->
    <div class="glass rounded-2xl p-6 mb-8 border border-vit-500/20">
      <h3 class="text-xl font-black text-gray-900 dark:text-white mb-4">✍️ Write a Review</h3>
      <form id="review-form" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Rate your experience</label>
          <div class="flex gap-2" id="star-input-container">
            ${[1,2,3,4,5].map(i=>`<button type="button" class="star-btn text-3xl" data-val="${i}">★</button>`).join('')}
          </div>
          <input type="hidden" id="review-rating" value="0">
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">About (product name / seller / platform)</label>
          <input type="text" id="review-subject" class="vit-input" placeholder="e.g. MacBook Pro by Rahul, or ViTMART Platform" required>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Your Review</label>
          <textarea id="review-text" class="vit-input resize-none" rows="4" placeholder="Share your honest experience..." required></textarea>
        </div>
        <div class="flex gap-3">
          <label class="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            <input type="checkbox" id="review-anonymous" class="styled-check">
            Post anonymously
          </label>
        </div>
        <button type="submit" class="px-6 py-2.5 bg-gradient-to-r from-vit-600 to-cyan-500 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30 hover:-translate-y-0.5 transition-transform">
          Post Review ⭐
        </button>
      </form>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-wrap gap-2 mb-6" id="review-filter-bar">
      <button class="cat-pill active" data-filter="all">All ⭐</button>
      <button class="cat-pill" data-filter="5">5 Stars 🌟</button>
      <button class="cat-pill" data-filter="4">4 Stars</button>
      <button class="cat-pill" data-filter="3">3 Stars</button>
      <button class="cat-pill" data-filter="1,2">1-2 Stars</button>
    </div>

    <!-- Reviews Feed -->
    <div id="reviews-feed" class="space-y-4">
      <div class="text-center py-12 text-gray-400">Loading reviews…</div>
    </div>`;

  // Star interaction
  let selectedRating = 0;
  const stars = c.querySelectorAll('.star-btn');
  const ratingInput = c.querySelector('#review-rating');
  stars.forEach(btn => {
    btn.addEventListener('mouseover', () => {
      const v = +btn.dataset.val;
      stars.forEach((s,i) => s.classList.toggle('active', i < v));
    });
    btn.addEventListener('mouseout', () => {
      stars.forEach((s,i) => s.classList.toggle('active', i < selectedRating));
    });
    btn.addEventListener('click', () => {
      selectedRating = +btn.dataset.val;
      ratingInput.value = selectedRating;
      stars.forEach((s,i) => s.classList.toggle('active', i < selectedRating));
    });
  });

  // Filter logic
  let allReviews = [];
  let activeFilter = 'all';
  c.querySelector('#review-filter-bar').addEventListener('click', e => {
    const btn = e.target.closest('.cat-pill');
    if (!btn) return;
    c.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderReviewsFeed(allReviews, activeFilter);
  });

  // Live listener
  reviewsUnsubscribe = db.collection('reviews').orderBy('createdAt','desc').limit(50).onSnapshot(snap => {
    allReviews = snap.docs.map(d => ({id:d.id,...d.data()}));
    renderReviewsFeed(allReviews, activeFilter);
  });

  // Submit
  c.querySelector('#review-form').addEventListener('submit', async e => {
    e.preventDefault();
    const rating = +c.querySelector('#review-rating').value;
    if (rating < 1) { showMessage('Please select a star rating.','error'); return; }
    const subject = c.querySelector('#review-subject').value.trim();
    const text = filterProfanity(c.querySelector('#review-text').value.trim());
    const anon = c.querySelector('#review-anonymous').checked;
    if (!text) return;
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
    try {
      await db.collection('reviews').add({
        rating, subject, text,
        authorId: anon ? null : currentUser.uid,
        authorName: anon ? 'Anonymous Student' : (currentUser.displayName || 'Student'),
        authorPhoto: anon ? null : currentUser.photoURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Track for recommendations
      trackUserInterest(subject, 'review');
      showMessage('Review posted! 🌟','success');
      e.target.reset();
      selectedRating = 0;
      c.querySelectorAll('.star-btn').forEach(s => s.classList.remove('active'));
      ratingInput.value = 0;
    } catch(err) { showMessage('Error: '+err.message,'error'); }
    finally { btn.disabled=false; btn.innerHTML='Post Review ⭐'; }
  });
};

const renderReviewsFeed = (reviews, filter='all') => {
  const feed = document.getElementById('reviews-feed');
  if (!feed) return;
  let list = reviews;
  if (filter !== 'all') {
    const vals = filter.split(',').map(Number);
    list = reviews.filter(r => vals.includes(r.rating));
  }
  if (list.length === 0) {
    feed.innerHTML = `<div class="text-center py-16 text-gray-400">
      <div class="text-5xl mb-3">⭐</div>
      <p class="font-medium">No reviews yet. Be the first!</p>
    </div>`; return;
  }
  const avgRating = (list.reduce((s,r)=>s+r.rating,0)/list.length).toFixed(1);
  feed.innerHTML = `
    <div class="glass p-4 rounded-2xl mb-6 flex items-center gap-4 border border-amber-200/50 dark:border-amber-800/30">
      <div class="text-4xl font-black text-amber-500">${avgRating}</div>
      <div>
        <div class="flex gap-0.5 text-xl">${[1,2,3,4,5].map(i=>`<span class="${i<=Math.round(avgRating)?'text-amber-400':'text-gray-300'}">★</span>`).join('')}</div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">${list.length} review${list.length!==1?'s':''}</p>
      </div>
    </div>
    ${list.map(r => {
      const initials = (r.authorName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const avatar = r.authorPhoto
        ? `<img src="${r.authorPhoto}" class="w-10 h-10 rounded-xl object-cover">`
        : `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-vit-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">${initials}</div>`;
      const timeAgo = r.createdAt ? timeAgoStr(r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt)) : '';
      const canDelete = currentUser && r.authorId === currentUser.uid;
      return `
      <div class="review-card" data-review-id="${r.id}">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            ${avatar}
            <div>
              <p class="font-bold text-gray-900 dark:text-white text-sm">${esc(r.authorName)}</p>
              <p class="text-xs text-gray-400">${timeAgo}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex text-lg">${[1,2,3,4,5].map(i=>`<span class="${i<=r.rating?'text-amber-400':'text-gray-300'}">★</span>`).join('')}</div>
            ${canDelete ? `<button class="delete-review-btn p-1 text-gray-300 hover:text-rose-500 transition-colors rounded-lg" data-id="${r.id}" title="Delete review"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>` : ''}
          </div>
        </div>
        ${r.subject ? `<p class="text-xs font-bold text-vit-600 dark:text-vit-400 mb-2 uppercase tracking-wider">Re: ${esc(r.subject)}</p>` : ''}
        <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">${esc(r.text)}</p>
      </div>`;
    }).join('')}`;

  // Delete handlers
  feed.querySelectorAll('.delete-review-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirmModal('Delete this review?', async () => {
        try { await db.collection('reviews').doc(btn.dataset.id).delete(); showMessage('Review deleted.','success'); }
        catch(err) { showMessage('Error: '+err.message,'error'); }
      });
    });
  });
};

const timeAgoStr = (date) => {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

// ══════════════════════════════════════════════
// NEW FEATURE: MANAGE & CLEANUP PAGE
// ══════════════════════════════════════════════
