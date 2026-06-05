const renderLostAndFoundPage = () => {
  const c = document.getElementById('lost-and-found-tab');
  c.innerHTML = `
    ${getBackButtonHTML()}
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
      <div><p class="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">Campus Board</p><h2 class="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">Lost & Found</h2></div>
      <div class="flex gap-3">
        <button class="add-lost-found-btn px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold rounded-xl shimmer-btn shadow-lg shadow-rose-500/30 text-sm" data-type="lost">Report Lost</button>
        <button class="add-lost-found-btn px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shimmer-btn shadow-lg shadow-emerald-500/30 text-sm" data-type="found">Report Found</button>
      </div>
    </div>
    <div class="glass p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-3 items-center">
      <div class="relative flex-grow">
        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
        <input type="search" id="lost-found-search-input" placeholder="Search by title or description..." class="vit-input pl-9 text-sm w-full">
      </div>
      <select id="lost-found-filter-status" class="vit-input text-sm w-full md:w-48">
        <option value="all">Show All</option><option value="lost">Lost Items</option><option value="found">Found Items</option>
      </select>
    </div>
    <div id="lost-and-found-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>`;
  filterAndRenderLostFoundItems();
  document.getElementById('lost-found-search-input').addEventListener('input', debounce(filterAndRenderLostFoundItems, 280));
  document.getElementById('lost-found-filter-status').addEventListener('change', filterAndRenderLostFoundItems);
};

const filterAndRenderLostFoundItems = () => {
  const c = document.getElementById('lost-and-found-list-container');
  if (!c) return;
  const search = document.getElementById('lost-found-search-input')?.value.toLowerCase()||'';
  const status = document.getElementById('lost-found-filter-status')?.value||'all';
  let list = [...lostAndFoundItems];
  if (search) list = list.filter(i => i.title.toLowerCase().includes(search)||i.description.toLowerCase().includes(search));
  if (status!=='all') list = list.filter(i => i.reportType===status);
  c.innerHTML = '';
  if (list.length > 0) list.forEach(i => c.appendChild(createLostAndFoundCard(i)));
  else c.innerHTML = `<p class="text-gray-400 text-center py-10 col-span-full">No items matching your search. 🤷</p>`;
};

const createLostAndFoundCard = (item) => {
  const card = document.createElement('div');
  const isResolved = item.status === 'resolved';
  const isLost = item.reportType === 'lost';
  card.className = `glass rounded-2xl overflow-hidden flex flex-col ${isResolved?'opacity-60':''}`;
  const date = item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Just now';
  const isMyReport = currentUser?.uid === item.reporterId;
  let action = '';
  if (isMyReport) {
    action = `
      <div class="flex items-center gap-2 mt-4">
        <button class="resolve-lost-found-btn flex-grow py-2 text-sm font-bold rounded-xl text-white ${isResolved?'bg-gradient-to-r from-amber-500 to-amber-600':'bg-gradient-to-r from-cyan-500 to-cyan-600'}" data-id="${item.id}" data-status="${item.status}">
          ${isResolved?'Mark Active':'Mark Resolved'}
        </button>
        <button class="delete-lost-found-btn p-2 glass rounded-xl text-gray-400 hover:text-rose-500 transition-colors" data-id="${item.id}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>`;
  } else {
    const subj = `ViTMART: About "${item.title}"`;
    const body = `Hi ${item.reporterName},%0D%0AI saw your ${item.reportType} item listing on ViTMART.%0D%0A%0D%0AThanks,`;
    action = `<a href="mailto:${item.reporterEmail}?subject=${subj}&body=${body}" class="mt-4 block w-full text-center py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white font-bold rounded-xl shimmer-btn text-sm">Contact ${isLost?'Owner':'Finder'}</a>`;
  }
  card.innerHTML = `
    <div class="relative">
      <img src="${optimizeImage(item.imageUrl,600)||'https://placehold.co/400x300/e8e0ff/7c3aed?text=?'}" alt="${esc(item.title)}" class="w-full h-44 object-cover ${isResolved?'grayscale':''}" loading="lazy" decoding="async">
      <div class="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-full text-white ${isLost?'bg-rose-500':'bg-emerald-500'}">${isLost?'LOST':'FOUND'}</div>
      ${isResolved?`<div class="absolute top-3 right-3 px-2.5 py-1 text-xs font-bold bg-gray-700 text-white rounded-full">RESOLVED</div>`:''}
    </div>
    <div class="p-5 flex flex-col flex-grow">
      <h3 class="font-bold text-gray-900 dark:text-white truncate">${esc(item.title)}</h3>
      <p class="text-xs text-gray-400 mt-1">by ${esc(item.reporterName)} · ${date}</p>
      <p class="text-gray-600 dark:text-gray-300 text-sm mt-3 flex-grow leading-relaxed">${esc(item.description)}</p>
      <div class="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 space-y-1 text-xs">
        <p><strong class="text-gray-400">${isLost?'Last seen:':'Found at:'}</strong> <span class="text-gray-600 dark:text-gray-300">${esc(item.location)}</span></p>
        ${!isLost&&item.collectionPoint?`<p><strong class="text-gray-400">Collect at:</strong> <span class="text-gray-600 dark:text-gray-300">${esc(item.collectionPoint)}</span></p>`:''}
      </div>
      ${action}
    </div>`;
  return card;
};

const handleLostFoundStatusChange = async (itemId, currentStatus) => {
  const newStatus = currentStatus==='active'?'resolved':'active';
  try { await db.collection('lost_and_found').doc(itemId).update({status:newStatus}); showMessage(`Marked as ${newStatus}.`,'success'); }
  catch(e) { showMessage('Failed to update status.','error'); }
};

const renderLostAndFoundModal = (reportType='lost') => {
  uploadedLostFoundFile = null;
  const isLost = reportType==='lost';
  lostAndFoundModalContent.innerHTML = `
    <form id="lost-and-found-form" class="p-6 space-y-4" novalidate>
      <div class="text-center mb-2">
        <div class="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3 ${isLost?'bg-rose-100 dark:bg-rose-900/30':'bg-emerald-100 dark:bg-emerald-900/30'}">${isLost?'😢':'🎉'}</div>
        <h2 class="text-2xl font-black font-syne text-gray-900 dark:text-white">Report ${isLost?'a Lost':'a Found'} Item</h2>
      </div>
      <input type="hidden" id="reportType" value="${reportType}">
      <div>
        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Image *</label>
        <div id="lost-found-drop-zone" class="drop-zone flex justify-center items-center w-full h-40 rounded-2xl bg-gray-50 dark:bg-white/5 cursor-pointer">
          <div id="lost-found-upload-prompt" class="text-center text-gray-400 text-sm">📷 Drag & drop or <span class="font-bold text-vit-600 dark:text-vit-400">click to upload</span><input type="file" id="lostFoundImageUpload" class="hidden" accept="image/*"></div>
          <img id="lost-found-image-preview" class="hidden w-full h-full object-contain rounded-2xl p-2">
        </div>
      </div>
      <input type="text" id="lostFoundTitle" placeholder="Item Title *" class="vit-input" required>
      <textarea id="lostFoundDescription" placeholder="Detailed Description *" class="vit-input resize-none" rows="3" required></textarea>
      <input type="text" id="lostFoundLocation" placeholder="${isLost?'Last Seen Location *':'Location Found *'}" class="vit-input" required>
      ${!isLost?`<input type="text" id="lostFoundCollectionPoint" placeholder="Collection Point *" class="vit-input" required>`:''}
      <div class="flex gap-3 pt-2">
        <button type="button" id="cancel-lost-found-btn" class="flex-1 py-2.5 glass rounded-xl font-semibold text-sm hover:-translate-y-0.5 transition-transform">Cancel</button>
        <button type="submit" id="submit-lost-found-btn" class="flex-1 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn">Submit Report</button>
      </div>
    </form>`;
  lostAndFoundModal.classList.add('show');
  setupImageUploadListeners('lost-found-drop-zone','lostFoundImageUpload','lost-found-image-preview','lost-found-upload-prompt', f => uploadedLostFoundFile = f);
};

// --- Orders ---
