const setActiveTab = (tabName, isBackAction = false) => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));

  // Smooth fade-out → render → fade-in transition
  const prevTab = document.querySelector('.tab-content.active');
  const doSwitch = () => {
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.remove('active','animate-tab-content');
      c.style.opacity = '';
      c.style.transform = '';
    });
    if (!isBackAction && navigationHistory[navigationHistory.length-1] !== tabName) navigationHistory.push(tabName);
    if (offersUnsubscribe && tabName !== 'product-detail') offersUnsubscribe();
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
      switch(tabName) {
        case 'home':         safeRender(renderHomePage, 'home'); break;
        case 'buy':          safeRender(renderBuyPage, 'buy'); break;
        case 'trade':        safeRender(renderTradePage, 'trade'); break;
        case 'sell':         safeRender(renderSellPage, 'sell'); break;
        case 'lost-and-found': safeRender(renderLostAndFoundPage, 'lost-and-found'); break;
        case 'my-listings':  safeRender(window.renderMyListingsPageV2 || renderMyListingsPage, 'my-listings'); break;
        case 'orders':       safeRender(renderOrdersPage, 'orders'); break;
        case 'profile':      safeRender(renderProfilePage, 'profile'); break;
        case 'reviews':      safeRender(renderReviewsPage, 'reviews'); break;
        case 'manage':       safeRender(renderManagePage, 'manage'); break;
        case 'noticeboard':  safeRender(renderNoticeboardPage, 'noticeboard'); break;
        case 'product-detail': break;
      }
      activeTab.classList.add('active');
      // Stagger: add animation class on next frame for a crisp spring-in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => activeTab.classList.add('animate-tab-content'));
      });
      if (tabName !== 'noticeboard' && typeof noticeUnsubscribe === 'function') noticeUnsubscribe();
    }
  };

  // If there's a visible tab, fade it out briefly first
  if (prevTab && prevTab.id !== `${tabName}-tab`) {
    prevTab.style.transition = 'opacity 0.15s ease, transform 0.18s ease';
    prevTab.style.opacity = '0';
    prevTab.style.transform = 'translateY(-8px)';
    setTimeout(doSwitch, 160);
  } else {
    doSwitch();
  }
};

const handleGoBack = () => {
  if (navigationHistory.length > 1) { navigationHistory.pop(); setActiveTab(navigationHistory[navigationHistory.length-1], true); }
  else setActiveTab('home');
};

const getBackButtonHTML = () => `
  <button id="go-back-btn" class="mb-6 inline-flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-vit-500/20 hover:-translate-y-0.5">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
    Back
  </button>`;

const showConfirmModal = (message, onConfirm) => {
  confirmModalContent.innerHTML = `
    <div class="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
      <svg class="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
    </div>
    <p class="text-base font-semibold text-gray-900 dark:text-white mb-5">${message}</p>
    <div class="flex justify-center space-x-3">
      <button id="confirm-cancel" class="px-5 py-2 glass rounded-xl font-semibold text-sm hover:-translate-y-0.5 transition-transform">Cancel</button>
      <button id="confirm-ok" class="px-5 py-2 bg-rose-500 text-white rounded-xl font-semibold text-sm hover:bg-rose-600 hover:-translate-y-0.5 transition-all">Confirm</button>
    </div>`;
  confirmModal.classList.add('show');
  document.getElementById('confirm-ok').onclick = () => { onConfirm(); confirmModal.classList.remove('show'); };
  document.getElementById('confirm-cancel').onclick = () => confirmModal.classList.remove('show');
};

const validateInput = (input, fn, msg) => {
  const errEl = input.parentElement.querySelector('.error-message');
  if (!fn(input.value)) {
    input.classList.add('input-error');
    if (!errEl) input.insertAdjacentHTML('afterend', `<p class="error-message">${msg}</p>`);
    else errEl.textContent = msg;
    return false;
  } else {
    input.classList.remove('input-error');
    if (errEl) errEl.remove();
    return true;
  }
};

const showWelcomeAnimation = (user) => {
  const firstName = (user.displayName || 'Student').split(' ')[0];
  welcomeOverlay.style.display = 'flex';
  welcomeOverlay.style.alignItems = 'center';
  welcomeOverlay.style.justifyContent = 'center';
  welcomeOverlay.style.overflow = 'hidden';
  // Full rebuild — never += to prevent duplicates
  welcomeOverlay.innerHTML = `
    <div class="orb orb-purple" style="width:500px;height:500px;top:-80px;left:-120px"></div>
    <div class="orb orb-cyan" style="width:400px;height:400px;bottom:-60px;right:-100px"></div>
    <div class="orb orb-rose" style="width:260px;height:260px;top:60%;left:60%"></div>
    <div style="position:relative;z-index:10;text-align:center;color:white;padding:24px;width:100%;max-width:700px;margin:0 auto">
      <div class="welcome-icon" style="font-size:4.5rem;line-height:1;margin-bottom:28px">⚡</div>
      <div class="welcome-line1" style="font-size:clamp(1rem,4vw,1.2rem);font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:rgba(167,139,250,0.8);margin-bottom:16px">
        Welcome to ViTMART
      </div>
      <div class="welcome-line2" style="font-size:clamp(2.8rem,8vw,5.5rem);font-weight:900;line-height:1.05;letter-spacing:-0.03em;white-space:nowrap">
        <span style="background:linear-gradient(135deg,#ffffff 0%,#c4b5fd 40%,#22d3ee 70%,#fb7185 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">Hello, ${firstName}!</span>
      </div>
      <div class="welcome-sub" style="margin-top:20px;font-size:clamp(0.85rem,2vw,1.05rem);color:rgba(196,181,253,0.7);font-weight:500;letter-spacing:0.05em">
        Your campus marketplace is ready
      </div>
      <div style="margin-top:32px;height:2px;width:80px;margin-left:auto;margin-right:auto;border-radius:2px;overflow:hidden;background:rgba(139,92,246,0.2)">
        <div class="welcome-bar" style="height:100%;background:linear-gradient(90deg,#7c3aed,#06b6d4,#f43f5e)"></div>
      </div>
    </div>`;
  welcomeOverlay.classList.add('show');
  setTimeout(() => {
    welcomeOverlay.classList.remove('show');
    setTimeout(() => { appContainer.classList.remove('opacity-0'); }, 100);
  }, 3200);
};

const triggerConfetti = () => {
  const colors = ['#7c3aed','#06b6d4','#f43f5e','#10b981','#f59e0b','#a78bfa'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.classList.add('confetti');
    p.style.left = `${window.innerWidth/2}px`;
    p.style.top = `${window.innerHeight/2}px`;
    p.style.setProperty('--color', colors[Math.floor(Math.random()*colors.length)]);
    const angle = Math.random()*360;
    const dist = Math.random()*(window.innerWidth/2);
    p.style.setProperty('--x', `${Math.cos(angle*Math.PI/180)*dist}px`);
    p.style.setProperty('--y', `${Math.sin(angle*Math.PI/180)*dist}px`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2200);
  }
};

// Stats counter placeholder (no stat cards currently rendered — kept for future use)
const initStatsCounters = () => {};

const setupScrollAnimations = () => {
  const faders = document.querySelectorAll('.fade-in-section');
  const isMobile = window.innerWidth < 640;
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      // Stagger direct children for a cascade reveal
      const kids = Array.from(entry.target.children);
      kids.forEach((child, i) => {
        if (!child.style.transitionDelay) {
          child.style.transitionDelay = `${i * 55}ms`;
        }
      });
      o.unobserve(entry.target);
    });
  }, { threshold: isMobile ? 0.04 : 0.12, rootMargin: '0px 0px -20px 0px' });
  faders.forEach(f => obs.observe(f));
};

// --- Header ---
