const renderHomePage = () => {
  const homeTab = document.getElementById('home-tab');
  const now = Date.now();
  const productCount = products.length;

  // Serve from cache if still fresh AND product count hasn't changed
  if (
    _homeCache &&
    (now - _homeCacheTime) < HOME_TTL &&
    productCount === _homeCacheProductCount
  ) {
    homeTab.innerHTML = _homeCache;
    // Re-attach dynamic sections (they read live data)
    renderHomepageCategories();
    renderRecentlyAddedProducts();
    renderHomepageLostAndFoundPreview();
    setupScrollAnimations();
    return;
  }

  _buildHomePage(homeTab);
  _homeCache = homeTab.innerHTML;
  _homeCacheTime = now;
  _homeCacheProductCount = productCount;
};

// Invalidate cache whenever products change (called from onSnapshot)
const invalidateHomeCache = () => { _homeCache = null; };

const _buildHomePage = (homeTab) => {
  homeTab.innerHTML = `
  <!-- HERO -->
  <section class="hero-bg relative overflow-hidden noise min-h-[92vh] flex items-center">
    <div class="orb orb-purple w-[500px] h-[500px] top-10 -left-32 opacity-30"></div>
    <div class="orb orb-cyan w-[400px] h-[400px] bottom-0 right-0 opacity-20"></div>
    <div class="orb orb-rose w-72 h-72 top-1/2 right-1/4 opacity-15"></div>
    <div class="absolute inset-0 grid-overlay opacity-50"></div>

    <!-- Floating Particles -->
    <div class="absolute inset-0 pointer-events-none">
      ${Array.from({length:20}).map((_,i) => `
        <div class="particle w-${[1,2][i%2]+1} h-${[1,2][i%2]+1} bg-vit-500/40" style="left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*-8}s;animation-duration:${6+Math.random()*6}s;opacity:${0.2+Math.random()*0.4}"></div>`).join('')}
    </div>

    <div class="relative z-10 container mx-auto px-6 py-24 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vit-900/60 border border-vit-500/30 text-vit-300 text-sm font-semibold mb-8 backdrop-blur-sm">
        <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
        Student Marketplace — Buy, Sell & Trade
      </div>
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight">
        The Smart Way<br>
        <span class="display-heading" style="font-size:0.92em;background:linear-gradient(135deg,#c4b5fd 0%,#22d3ee 45%,#fb7185 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;margin-top:4px">to Trade on Campus</span>
      </h1>
      <p class="mt-7 max-w-2xl mx-auto text-lg text-gray-300/80 leading-relaxed font-light">
        Buy pre-loved textbooks, sell old electronics, or trade items you no longer need — all within your verified campus community. <span class="text-vit-300 font-medium">No fees. No strangers. No shipping.</span>
      </p>
      <div class="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button data-tab="buy" class="px-8 py-4 bg-gradient-to-r from-vit-600 to-vit-700 text-white font-bold rounded-2xl shimmer-btn shadow-2xl shadow-vit-500/40 text-base">
          Browse Items →
        </button>
        <button data-tab="sell" class="px-8 py-4 glass text-white font-bold rounded-2xl glow-btn text-base border border-vit-500/30">
          Start Selling
        </button>
      </div>

      <!-- ⌘K hint -->
      <div class="mt-8 flex justify-center">
        <button id="open-cmd-palette-btn" class="flex items-center gap-2 px-4 py-2 glass rounded-xl text-gray-400 text-sm border border-white/10 hover:border-vit-500/30 transition-all hover:-translate-y-0.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          Quick search anything...
          <span class="kbd-hint ml-2">⌘ K</span>
        </button>
      </div>

      <!-- Feature pills -->
      <div class="mt-14 flex flex-wrap justify-center gap-3">
        ${[['🎒','Students Only'],['⚡','List in 60s'],['🔄','Trade & Buy'],['🔒','Campus Safe'],['💰','Zero Fees']].map(([icon,label]) => `
          <div class="feature-pill text-white/80">
            <span>${icon}</span>
            <span class="font-semibold text-xs tracking-wide">${label}</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 animate-bounce">
      <span class="text-xs tracking-widest uppercase font-medium">Scroll</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
    </div>
  </section>

  <!-- PREMIUM TICKER -->
  <div class="relative overflow-hidden" style="background:linear-gradient(105deg,#0d0820 0%,#160a30 40%,#0a1830 100%);border-top:1px solid rgba(139,92,246,0.12);border-bottom:1px solid rgba(139,92,246,0.12)">
    <!-- Left edge fade -->
    <div class="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style="background:linear-gradient(90deg,#0d0820 0%,transparent 100%)"></div>
    <!-- Right edge fade -->
    <div class="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style="background:linear-gradient(270deg,#0d0820 0%,transparent 100%)"></div>
    <div class="py-3 overflow-hidden" style="mask-image:linear-gradient(90deg,transparent 0%,black 8%,black 92%,transparent 100%)">
      <div class="ticker-content" style="animation:ticker 40s linear infinite" onmouseenter="this.style.animationPlayState='paused'" onmouseleave="this.style.animationPlayState='running'">
        ${(()=>{
          const items=[
            {icon:'⚡',label:'ViTMART',accent:true},
            {icon:'📚',label:'Textbooks & Study Material',accent:false},
            {icon:'💻',label:'Electronics & Gadgets',accent:false},
            {icon:'🔄',label:'Trade & Barter',accent:true},
            {icon:'🛋️',label:'Furniture & Decor',accent:false},
            {icon:'👕',label:'Clothing & Accessories',accent:false},
            {icon:'🔍',label:'Lost & Found Board',accent:true},
            {icon:'✏️',label:'Stationery & Supplies',accent:false},
            {icon:'⚽',label:'Sports Gear',accent:false},
            {icon:'🎟️',label:'Event Tickets',accent:false},
            {icon:'🛡️',label:'Verified Students Only',accent:true},
            {icon:'📍',label:'On-Campus Meetups',accent:false},
          ];
          // Duplicate for seamless loop
          return [...items,...items].map((item,i)=>`
            <span class="inline-flex items-center gap-3 select-none" style="padding:0 28px">
              <span style="font-size:11px;color:rgba(139,92,246,0.4)">✦</span>
              <span style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${item.accent?'#a78bfa':'rgba(255,255,255,0.45)'}">
                ${item.icon}&nbsp;${item.label}
              </span>
            </span>`).join('');
        })()}
      </div>
    </div>
  </div>

  <!-- HOW IT WORKS -->
  <section class="py-24 fade-in-section relative overflow-hidden">
    <div class="absolute inset-0 grid-overlay opacity-40 dark:opacity-20"></div>
    <div class="container mx-auto px-6 relative z-10">
      <div class="text-center mb-16">
        <div class="section-eyebrow justify-center mb-4">Simple Process</div>
        <h2 class="text-4xl font-black text-gray-900 dark:text-white">
          How <span class="grad-text-vp">ViTMART</span> Works
        </h2>
        <p class="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Three effortless steps to your next campus deal.</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8 relative">
        <!-- Connecting line (desktop) -->
        <div class="hidden md:block absolute top-16 left-1/4 right-1/4 h-px" style="background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent)"></div>
        ${[
          {icon:'✍️',num:'01',title:'Create Account',desc:'Sign up with your student email in under 30 seconds. Instantly access the full marketplace.'},
          {icon:'🔍',num:'02',title:'Browse or List',desc:'Find what you need, or list items you want to sell — upload a photo, set a price, and go live.'},
          {icon:'🤝',num:'03',title:'Connect & Exchange',desc:'Meet fellow students on campus to safely hand off the item. That\'s it — deal done!'},
        ].map((s,i) => `
          <div class="hiw-card glass p-8 rounded-2xl text-center relative group" style="animation-delay:${i*120}ms">
            <div class="absolute top-5 right-5 font-black text-6xl select-none pointer-events-none" style="color:rgba(139,92,246,0.07);font-size:5rem;line-height:1">${s.num}</div>
            <div class="relative">
              <div class="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-3xl" style="background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(6,182,212,0.1));border:1px solid rgba(139,92,246,0.2)">
                <span class="hiw-icon">${s.icon}</span>
              </div>
              <h3 class="text-xl font-bold mb-3 text-gray-900 dark:text-white">${s.title}</h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">${s.desc}</p>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- WHY VITMART -->
  <section class="py-24 relative overflow-hidden fade-in-section">
    <div class="absolute inset-0" style="background:radial-gradient(ellipse 70% 50% at 50% 100%, rgba(139,92,246,0.07) 0%, transparent 70%)"></div>
    <div class="container mx-auto px-6 relative z-10">
      <div class="text-center mb-16">
        <div class="section-eyebrow justify-center mb-4">Why Choose Us</div>
        <h2 class="text-4xl font-black text-gray-900 dark:text-white">
          Built <span class="display-heading">for</span> Students
        </h2>
        <p class="mt-4 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">Everything designed with your campus life in mind.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${[
          {icon:'🛡️',title:'Verified Only',desc:'Exclusive to verified students — no random strangers, just your campus community.',grad:'from-vit-500 to-vit-700',glow:'rgba(124,58,237,0.3)'},
          {icon:'📍',title:'On-Campus Easy',desc:'No shipping, no courier fees. Meet in 5 minutes at the library or canteen.',grad:'from-cyan-500 to-cyan-700',glow:'rgba(6,182,212,0.3)'},
          {icon:'💰',title:'Save More',desc:'Find textbooks, gear, and gadgets at student-friendly prices. Sell what you no longer need.',grad:'from-emerald-500 to-emerald-700',glow:'rgba(16,185,129,0.3)'},
          {icon:'♻️',title:'Go Green',desc:'Give pre-loved items a second life. Every trade reduces waste and helps the planet.',grad:'from-rose-500 to-rose-700',glow:'rgba(244,63,94,0.3)'},
        ].map((f,i) => `
          <div class="glass p-7 rounded-2xl group hover:-translate-y-3 transition-all duration-350 cursor-default" style="transition-delay:${i*60}ms">
            <div class="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300 w-12 h-12" style="background:linear-gradient(135deg,var(--g1),var(--g2));box-shadow:0 8px 25px ${f.glow}" data-grad="${f.grad}">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${f.grad}" style="box-shadow:0 8px 25px ${f.glow}">
                ${f.icon}
              </div>
            </div>
            <h3 class="text-lg font-bold mb-2 text-gray-900 dark:text-white">${f.title}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">${f.desc}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- CATEGORIES -->
  <section class="py-24 fade-in-section relative overflow-hidden">
    <div class="absolute inset-0 grid-overlay opacity-30 dark:opacity-10 pointer-events-none"></div>
    <div class="container mx-auto px-6 relative z-10">
      <div class="text-center mb-14">
        <div class="section-eyebrow justify-center mb-4">Explore</div>
        <h2 class="text-4xl font-black text-gray-900 dark:text-white">
          Shop by <span class="underline-gradient">Category</span>
        </h2>
        <p class="mt-4 text-gray-500 dark:text-gray-400">From notes to gadgets — find exactly what you need.</p>
      </div>
      <div id="homepage-categories-container" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"></div>
    </div>
  </section>

  <!-- RECENTLY ADDED -->
  <section class="py-24 relative fade-in-section">
    <div class="absolute inset-0" style="background:radial-gradient(ellipse 60% 40% at 0% 50%, rgba(139,92,246,0.06), transparent 60%)"></div>
    <div class="container mx-auto px-6 relative z-10">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
        <div>
          <div class="section-eyebrow mb-3">Fresh Listings</div>
          <h2 class="text-4xl font-black text-gray-900 dark:text-white">
            Recently <span class="grad-text-vp">Added</span>
          </h2>
        </div>
        <button data-tab="buy" class="flex items-center gap-2 text-vit-600 dark:text-vit-400 font-bold text-sm hover:gap-3 transition-all group">
          View All
          <span class="w-7 h-7 rounded-full flex items-center justify-center" style="background:rgba(139,92,246,0.12)">→</span>
        </button>
      </div>
      <div id="recently-added-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
    </div>
  </section>

  <!-- LOST & FOUND PREVIEW -->
  <section class="py-24 fade-in-section relative overflow-hidden">
    <div class="absolute inset-0 dot-grid opacity-20 dark:opacity-10 pointer-events-none"></div>
    <div class="container mx-auto px-6 relative z-10">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
        <div>
          <div class="section-eyebrow mb-3">Campus Board</div>
          <h2 class="text-4xl font-black text-gray-900 dark:text-white">
            Lost & <span class="underline-gradient">Found</span>
          </h2>
          <p class="mt-3 text-gray-500 dark:text-gray-400 text-sm">Help reunite your fellow students with their belongings.</p>
        </div>
        <button data-tab="lost-and-found" class="flex items-center gap-2 text-vit-600 dark:text-vit-400 font-bold text-sm hover:gap-3 transition-all">
          View All
          <span class="w-7 h-7 rounded-full flex items-center justify-center" style="background:rgba(139,92,246,0.12)">→</span>
        </button>
      </div>
      <div id="homepage-lost-and-found-container" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="py-24 fade-in-section relative overflow-hidden">
    <div class="absolute inset-0 dot-grid opacity-30 dark:opacity-10"></div>
    <div class="absolute top-20 right-10 w-64 h-64 orb orb-cyan opacity-10"></div>
    <div class="container mx-auto px-6 max-w-3xl relative z-10">
      <div class="text-center mb-14">
        <div class="section-eyebrow justify-center mb-4">Answers</div>
        <h2 class="text-4xl font-black text-gray-900 dark:text-white">
          <span class="underline-gradient">Common Questions</span>
        </h2>
        <p class="mt-4 text-gray-500 dark:text-gray-400 text-base">Everything you need to know about buying and selling on ViTMART.</p>
      </div>
      <div class="space-y-3">
        ${[
          {q:'What is ViTMART?', a:'ViTMART is a student-exclusive campus marketplace where you can buy, sell, and trade goods like textbooks, electronics, and furniture directly with fellow students — all on campus, no shipping needed.'},
          {q:'How do I get paid when I sell?', a:'All payments are handled directly between buyer and seller during your in-person campus meetup — cash, UPI, or whatever you both agree on. ViTMART facilitates the connection.'},
          {q:'Is it safe to meet buyers or sellers?', a:'Meet in well-lit, public places on campus — the library lobby, student union, or a busy cafeteria. Always let a friend know your meeting details for added safety.'},
          {q:'Can I trade items instead of selling?', a:'Yes! When listing an item, check "Accept Trade Offers." It will appear on the Trade page where others can make barter offers — no money required.'},
          {q:'What happens if I lose something on campus?', a:'Use the Lost & Found page to report a lost or found item. Add a photo, description, and location — other students can contact you directly via email to help reconnect the item with its owner.'},
        ].map((faq, i) => `
          <details class="faq-item" style="animation-delay:${i*80}ms">
            <summary class="flex items-center justify-between p-5 pr-6">
              <span class="font-bold text-gray-900 dark:text-white text-base pr-4">${faq.q}</span>
              <div class="faq-arrow w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background:rgba(139,92,246,0.1)">
                <svg class="w-4 h-4 text-vit-600 dark:text-vit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </summary>
            <div class="faq-body px-5 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-vit-100/50 dark:border-vit-900/30 pt-4">
              ${faq.a}
            </div>
          </details>`).join('')}
      </div>
    </div>
  </section>
  `;
  renderHomepageCategories();
  renderRecentlyAddedProducts();
  renderHomepageLostAndFoundPreview();
  setupScrollAnimations();
}; // end _buildHomePage

const renderHomepageCategories = () => {
  const el = document.getElementById('homepage-categories-container');
  if (!el) return;
  const cats = [
    {name:'Books',icon:'📚',value:'Books',color:'from-amber-400/20 to-amber-600/10',border:'rgba(245,158,11,0.25)'},
    {name:'Electronics',icon:'💻',value:'Electronics',color:'from-blue-400/20 to-blue-600/10',border:'rgba(59,130,246,0.25)'},
    {name:'Furniture',icon:'🛋️',value:'Furniture',color:'from-orange-400/20 to-orange-600/10',border:'rgba(249,115,22,0.25)'},
    {name:'Clothing',icon:'👕',value:'Clothing',color:'from-pink-400/20 to-pink-600/10',border:'rgba(236,72,153,0.25)'},
    {name:'Stationery',icon:'✏️',value:'Stationery',color:'from-yellow-400/20 to-yellow-600/10',border:'rgba(234,179,8,0.25)'},
    {name:'Sports Gear',icon:'⚽',value:'Sports Gear',color:'from-green-400/20 to-green-600/10',border:'rgba(34,197,94,0.25)'},
    {name:'Services',icon:'🤝',value:'Services',color:'from-purple-400/20 to-purple-600/10',border:'rgba(168,85,247,0.25)'},
    {name:'Tickets',icon:'🎟️',value:'Tickets',color:'from-red-400/20 to-red-600/10',border:'rgba(239,68,68,0.25)'},
    {name:'Other',icon:'📦',value:'Other',color:'from-gray-400/20 to-gray-600/10',border:'rgba(107,114,128,0.2)'},
    {name:'All Items',icon:'🛍️',value:'all',color:'from-vit-400/20 to-cyan-600/10',border:'rgba(139,92,246,0.25)'},
  ];
  el.innerHTML = cats.map((c,i) => `
    <div class="category-card glass p-5 rounded-2xl text-center" data-category="${c.value}" style="border-color:${c.border};animation-delay:${i*40}ms">
      <div class="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${c.color}" style="border:1px solid ${c.border}">
        <span class="cat-icon">${c.icon}</span>
      </div>
      <h3 class="font-bold text-sm text-gray-800 dark:text-white tracking-tight">${c.name}</h3>
    </div>`).join('');
};

const renderRecentlyAddedProducts = () => {
  const el = document.getElementById('recently-added-container');
  if (!el) return;
  el.innerHTML = '';
  const featured = products.filter(p => p.status==='available').sort((a,b) => (b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0)).slice(0,4);
  if (featured.length > 0) featured.forEach(p => el.appendChild(createProductCard(p)));
  else el.innerHTML = `<p class="text-gray-400 text-center py-10 col-span-full">No items yet — be the first to list! 🚀</p>`;
};

const renderHomepageLostAndFoundPreview = () => {
  const el = document.getElementById('homepage-lost-and-found-container');
  if (!el) return;
  const items = lostAndFoundItems.slice(0,3);
  if (items.length === 0) { el.innerHTML = `<p class="text-gray-400 text-center col-span-full py-8">All clear — nothing lost, nothing found!</p>`; return; }
  el.innerHTML = items.map(item => {
    const isLost = item.reportType === 'lost';
    return `
      <div class="glass p-4 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:shadow-vit-500/10 transition-all duration-200 hover:-translate-y-1">
        <img src="${optimizeImage(item.imageUrl,120)||'https://placehold.co/80x80/e8e0ff/7c3aed?text=?'}" alt="${esc(item.title)}" class="w-16 h-16 object-cover rounded-xl flex-shrink-0" loading="lazy" decoding="async">
        <div class="flex-grow min-w-0">
          <span class="text-xs font-bold px-2 py-0.5 rounded-full ${isLost?'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300':'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}">${isLost?'LOST':'FOUND'}</span>
          <h4 class="font-bold text-gray-900 dark:text-white mt-1 truncate text-sm">${item.title}</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${isLost?'Last seen:':'Found at:'} ${item.location}</p>
        </div>
      </div>`;
  }).join('');
};

// --- Product Cards ---
const createProductCard = (product) => {
  const card = document.createElement('div');
  card.className = "product-card tilt-card glass rounded-2xl overflow-hidden flex flex-col cursor-pointer relative";
  card.dataset.action = 'view-details';
  card.dataset.id = product.id;

  // Wishlist state
  const wishlist = JSON.parse(localStorage.getItem('vitmart_wishlist') || '[]');
  const isWishlisted = wishlist.includes(product.id);

  let actionArea = '';
  if (product.sellerId === currentUser?.uid && (product.status==='available'||product.status==='pending')) {
    actionArea = `
      <div class="flex items-center gap-1.5 pointer-events-auto flex-wrap">
        <span class="px-2.5 py-1 bg-vit-100 dark:bg-vit-900/40 text-vit-700 dark:text-vit-300 text-xs font-bold rounded-full">Your Listing</span>
        <button class="close-listing-btn p-1.5 text-gray-400 hover:text-amber-500 rounded-lg glass transition-colors" data-id="${product.id}" title="Close listing (hide from marketplace)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
        </button>
        <button class="delete-product-btn p-1.5 text-gray-400 hover:text-rose-500 rounded-lg glass transition-colors" data-id="${product.id}" title="Delete listing permanently">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>`;
  } else if (product.status === 'available') {
    actionArea = `<div class="flex flex-col gap-1.5 pointer-events-auto">
      <button class="add-to-cart-btn px-4 py-2 bg-gradient-to-r from-vit-600 to-vit-700 text-white text-xs font-bold rounded-xl shimmer-btn shadow-lg shadow-vit-500/30" data-id="${product.id}">Add to Cart</button>
    </div>`;
  }

  const soldBadge = product.status==='sold' ? '<div class="badge-sold">SOLD</div>' : product.status==='traded' ? '<div class="badge-traded">TRADED</div>' : product.status==='removed' ? '<div class="badge-sold" style="background:#6b7280">CLOSED</div>' : '';
  const tradeBadge = product.isTradeable ? '<div class="badge-tradeable">🔄 Trade</div>' : '';

  // Quick-view strip (only for available items not owned by user)
  const quickViewStrip = (product.status==='available' && product.sellerId !== currentUser?.uid) ? `
    <div class="quick-view-strip">
      <button class="quick-view-btn w-full text-center text-white text-xs font-bold py-1.5 tracking-wide opacity-90 hover:opacity-100" data-id="${product.id}">
        👁 Quick View
      </button>
    </div>` : '';

  card.innerHTML = `
    <div class="tilt-shine"></div>
    <div class="relative overflow-hidden pointer-events-none" style="position:relative">
      ${soldBadge}${tradeBadge}
      ${product.sellerId !== currentUser?.uid ? `
        <button class="wishlist-btn ${isWishlisted?'wishlisted':''}" data-id="${product.id}" title="Save to wishlist">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </button>` : ''}
      <img src="${optimizeImage(product.imageUrl, 400) || 'https://placehold.co/400x300/e8e0ff/7c3aed?text=No+Image'}" alt="${esc(product.name)}"
        class="w-full h-48 object-cover transition-transform duration-500 lightbox-trigger ${product.status!=='available'?'grayscale opacity-75':''}"
        data-src="${product.imageUrl}" loading="lazy" decoding="async">
      <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      ${quickViewStrip}
    </div>
    <div class="p-4 flex flex-col flex-grow pointer-events-none">
      <p class="text-xs text-gray-400 mb-1">by ${esc(product.sellerName||'a student')}</p>
      <h3 class="text-base font-bold text-gray-900 dark:text-white truncate">${esc(product.name)}</h3>
      <p class="text-gray-500 dark:text-gray-400 text-xs mt-1 flex-grow line-clamp-2 leading-relaxed">${esc(product.description)}</p>
      <div class="mt-3 flex justify-between items-center">
        <span class="text-xl font-black font-syne grad-text-vp">₹${product.price?.toFixed(0)||'N/A'}</span>
        <div class="pointer-events-auto">${actionArea}</div>
      </div>
    </div>`;
  return card;
};

const createProductSkeleton = () => {
  const s = document.createElement('div');
  s.className = 'skeleton-card';
  s.innerHTML = `<div class="skeleton-img"></div><div class="p-4 space-y-3"><div class="skeleton-text w-1/3 h-3"></div><div class="skeleton-text w-2/3 h-4"></div><div class="skeleton-text w-full h-3"></div><div class="flex justify-between mt-4"><div class="skeleton-text w-1/4 h-7"></div><div class="skeleton-text w-1/3 h-9 rounded-xl"></div></div></div>`;
  return s;
};

const filterControlsHTML = () => `
  <div class="glass p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-3 items-center flex-wrap">
    <div class="relative flex-grow w-full md:w-auto">
      <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
      <input type="search" id="search-input" placeholder="Search items..." class="vit-input pl-9 text-sm">
    </div>
    <select id="filter-category" class="vit-input flex-1 text-sm w-full md:w-auto">
      <option value="all">All Categories</option>
      <option value="Books">Books</option><option value="Electronics">Electronics</option><option value="Furniture">Furniture</option>
      <option value="Clothing">Clothing</option><option value="Stationery">Stationery</option><option value="Sports Gear">Sports Gear</option>
      <option value="Services">Services</option><option value="Tickets">Event Tickets</option><option value="Other">Other</option>
    </select>
    <select id="filter-price" class="vit-input flex-1 text-sm w-full md:w-auto">
      <option value="all">All Prices</option><option value="0-500">Under ₹500</option><option value="500-2000">₹500–₹2000</option>
      <option value="2000-5000">₹2000–₹5000</option><option value="5000-9999999">Over ₹5000</option>
    </select>
    <select id="filter-sort" class="vit-input flex-1 text-sm w-full md:w-auto">
      <option value="newest">Newest First</option><option value="price-asc">Price: Low→High</option><option value="price-desc">Price: High→Low</option>
    </select>
    <button id="reset-filters" class="px-4 py-2.5 glass rounded-xl text-sm font-semibold hover:-translate-y-0.5 transition-transform w-full md:w-auto">Reset</button>
  </div>`;
