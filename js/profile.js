const renderProfilePage = () => {
  if (!currentUser) return;
  const c = document.getElementById('profile-tab');
  const profileIcon = currentUser.photoURL
    ? `<img src="${currentUser.photoURL}" class="h-24 w-24 rounded-2xl object-cover ring-4 ring-vit-500/30 pfp-pop">`
    : `<div class="h-24 w-24 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center font-black text-white text-3xl ring-4 ring-vit-500/30 pfp-pop">${getInitials(currentUser.displayName)}</div>`;
  c.innerHTML = `
    <div class="max-w-3xl mx-auto">
      ${getBackButtonHTML()}
      <div class="mb-8"><p class="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">Account</p><h2 class="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">My Profile</h2></div>
      <div class="space-y-5">
        <div class="glass p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
          <div class="relative">${profileIcon}</div>
          <div class="text-center sm:text-left flex-grow">
            <h3 class="text-2xl font-black font-syne text-gray-900 dark:text-white">${currentUser.displayName}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">${currentUser.email}</p>
            <button id="change-pic-btn" class="mt-3 px-4 py-2 glass rounded-xl text-sm font-bold hover:-translate-y-0.5 transition-transform">Change Picture</button>
          </div>
        </div>
        <div class="glass p-6 rounded-2xl">
          <h3 class="font-black font-syne text-gray-900 dark:text-white mb-4">Account Details</h3>
          <form id="update-profile-form" class="space-y-4" novalidate>
            <div><label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label><input type="text" id="profile-name" value="${currentUser.displayName||''}" class="vit-input"></div>
            <div><label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email</label><input type="email" id="profile-email" value="${currentUser.email}" class="vit-input opacity-60 cursor-not-allowed" disabled></div>
            <div class="flex justify-end"><button type="submit" id="update-profile-btn" class="px-6 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">Save Changes</button></div>
          </form>
        </div>
        <div class="glass p-6 rounded-2xl flex justify-between items-center">
          <div><h3 class="font-black font-syne text-gray-900 dark:text-white">Security</h3><p class="text-sm text-gray-400 mt-1">Update your password</p></div>
          <button id="change-password-btn" class="px-5 py-2.5 glass rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform">Change Password</button>
        </div>
        <div class="glass p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div><h3 class="font-black font-syne text-gray-900 dark:text-white">Sign Out</h3><p class="text-sm text-gray-400 mt-1">Sign out of your account</p></div>
          <button id="sign-out-btn" class="px-5 py-2.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 hover:-translate-y-0.5 transition-all w-full sm:w-auto">Sign Out</button>
        </div>
      </div>
    </div>`;
  document.getElementById('profile-name').addEventListener('blur', e => validateInput(e.target, v=>v.trim().length>0, 'Name cannot be empty.'));
};

// --- Auth Modals ---
const renderAuthModal = (view='signin') => {
  if (emailVerificationInterval) clearInterval(emailVerificationInterval);
  const pwdHTML = `
    <div class="relative">
      <input type="password" id="${view}-password" placeholder="Password${view==='signup'?' (min. 6 chars)':''}" class="vit-input pr-12" required>
      <button type="button" class="password-toggle absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <svg class="h-5 w-5 eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
        <svg class="h-5 w-5 eye-slash-icon hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.742L2.293 6.546A10.005 10.005 0 01.458 10c1.274 4.057 5.022 7 9.542 7 1.126 0 2.206-.23 3.23-.65l-1.568-1.568z" clip-rule="evenodd"/></svg>
      </button>
    </div>`;

  if (view==='verify') {
    authModalContent.innerHTML = `
      <div class="text-center">
        <div class="w-16 h-16 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-xl shadow-vit-500/30">📧</div>
        <h2 class="text-2xl font-black font-syne text-gray-900 dark:text-white">Verify Your Email</h2>
        <p class="text-gray-500 mt-2 mb-6 text-sm">A verification link was sent to your inbox. Check spam too!</p>
        <div class="space-y-3">
          <button id="resend-verification-btn" class="w-full py-3 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">Resend Email</button>
          <button id="show-signin" class="w-full py-3 glass rounded-xl font-bold hover:-translate-y-0.5 transition-transform">Back to Sign In</button>
        </div>
      </div>`;
    emailVerificationInterval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) { clearInterval(emailVerificationInterval); showMessage('Email verified! Welcome!','success'); setTimeout(() => window.location.reload(), 2000); }
      }
    }, 3000);
    return;
  }

  authModalContent.innerHTML = `
    <div class="text-center mb-6">
      <div class="w-14 h-14 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-xl shadow-vit-500/30">⚡</div>
      <h2 class="text-2xl font-black font-syne text-gray-900 dark:text-white">${view==='signin'?'Welcome Back!':'Join ViTMART'}</h2>
      <p class="text-gray-400 text-sm mt-1">${view==='signin'?'Sign in to your account':'Create your student account'}</p>
    </div>
    <form id="${view}-form" class="space-y-4" novalidate>
      ${view==='signup'?`<input type="text" id="signup-name" placeholder="Full Name" class="vit-input" required>`:''}
      <input type="email" id="${view}-email" placeholder="Email Address" class="vit-input" required>
      ${pwdHTML}
      <button type="submit" class="w-full py-3 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-vit-500/30 mt-2">
        ${view==='signin'?'Sign In →':'Create Account →'}
      </button>
    </form>
    <p class="text-center text-sm text-gray-400 mt-5">
      ${view==='signin'?`No account? <button id="show-signup" class="font-bold text-vit-600 dark:text-vit-400 hover:underline">Sign up free</button>`:`Already a member? <button id="show-signin" class="font-bold text-vit-600 dark:text-vit-400 hover:underline">Sign in</button>`}
    </p>`;
  authModalContent.querySelector('input:not([type=hidden])')?.focus();
};

// --- Profile Pic Modal ---
const renderProfilePicModal = () => {
  uploadedPfpFile = null; selectedAvatarUrl = null;
  const avatars = ['🚀','💡','🌟','📚','💻','🎨','🍕','🧪','🎮','❤️','😂','🚲','🌍','🎓','🎵','🍔'].map((em,i) => {
    const colors = ['#f87171','#fb923c','#fbbf24','#4ade80','#60a5fa','#a78bfa','#f472b6','#22d3ee','#94a3b8','#f43f5e','#eab308','#22c55e','#06b6d4','#8b5cf6','#d946ef','#f97316'];
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='${encodeURIComponent(colors[i])}'/%3E%3Ctext x='50' y='68' font-size='50' text-anchor='middle' fill='white'%3E${encodeURIComponent(em)}%3C/text%3E%3C/svg%3E`;
  });
  profilePicModalContent.innerHTML = `
    <div class="p-6">
      <h2 class="text-2xl font-black font-syne text-center text-gray-900 dark:text-white mb-6">Change Profile Picture</h2>
      <div class="space-y-5">
        <div>
          <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Upload Photo</h3>
          <div id="pfp-drop-zone" class="drop-zone flex justify-center items-center w-full h-40 rounded-2xl bg-gray-50 dark:bg-white/5 cursor-pointer">
            <div id="pfp-upload-prompt" class="text-center text-gray-400 text-sm">📷 Drop or <label for="pfp-upload" class="font-bold text-vit-600 dark:text-vit-400 cursor-pointer">click to browse<input id="pfp-upload" type="file" class="sr-only" accept="image/*"></label></div>
            <img id="pfp-preview" class="hidden mx-auto h-24 w-24 rounded-2xl object-cover"/>
          </div>
        </div>
        <div class="flex items-center gap-3"><div class="h-px flex-grow bg-gray-200 dark:bg-gray-700"></div><span class="text-xs text-gray-400 font-bold">OR</span><div class="h-px flex-grow bg-gray-200 dark:bg-gray-700"></div></div>
        <div>
          <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Choose an Avatar</h3>
          <div id="avatar-grid" class="grid grid-cols-8 gap-2">
            ${avatars.map(a=>`<img src="${a}" class="avatar-option rounded-xl cursor-pointer transition-all duration-200 hover:scale-110 p-0.5 border-2 border-transparent" data-url="${a}">`).join('')}
          </div>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="cancel-pfp-btn" class="flex-1 py-2.5 glass rounded-xl font-bold hover:-translate-y-0.5 transition-transform">Cancel</button>
        <button id="save-pfp-btn" class="flex-1 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">Save</button>
      </div>
    </div>`;
  profilePicModal.classList.add('show');
  setupPfpUploadListeners();
};

const renderChangePasswordModal = () => {
  changePasswordModalContent.innerHTML = `
    <form id="change-password-form" class="p-8 space-y-4" novalidate>
      <div class="text-center mb-2">
        <div class="w-12 h-12 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl shadow-lg shadow-vit-500/30">🔑</div>
        <h2 class="text-2xl font-black font-syne text-gray-900 dark:text-white">Change Password</h2>
      </div>
      ${['current-password:Current Password:current-password','new-password:New Password:new-password','confirm-password:Confirm Password:new-password'].map(f=>{
        const [id,label,ac]=f.split(':');
        return `<div><label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">${label}</label><input type="password" id="${id}" class="vit-input" required autocomplete="${ac}"></div>`;
      }).join('')}
      <div class="flex gap-3 pt-2">
        <button type="button" id="cancel-change-password-btn" class="flex-1 py-2.5 glass rounded-xl font-bold hover:-translate-y-0.5 transition-transform">Cancel</button>
        <button type="submit" id="submit-change-password-btn" class="flex-1 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">Update Password</button>
      </div>
    </form>`;
  changePasswordModal.classList.add('show');
};

// --- Trade Modal ---
const _tradeModalReady = { setup: false };
const _initTradeModal = () => {
  if (_tradeModalReady.setup) return;
  _tradeModalReady.setup = true;
  tradeOfferModalContent.innerHTML = `
    <form id="trade-offer-form" class="p-6 space-y-4" novalidate>
      <div class="text-center mb-2">
        <div class="text-4xl mb-3">🔄</div>
        <h2 class="text-2xl font-black font-syne text-gray-900 dark:text-white">Make a Trade Offer</h2>
      </div>
      <div><label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Describe your offer *</label>
        <textarea id="tradeOfferText" placeholder="What are you offering in exchange?" class="vit-input resize-none" rows="4" required></textarea></div>
      <div><label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Item's Image (optional)</label>
        <div id="trade-offer-drop-zone" class="drop-zone flex justify-center items-center w-full h-36 rounded-2xl bg-gray-50 dark:bg-white/5 cursor-pointer">
          <div id="trade-offer-upload-prompt" class="text-center text-gray-400 text-sm">📷 Drag & drop or click<input type="file" id="tradeOfferImageUpload" class="hidden" accept="image/*"></div>
          <img id="trade-offer-image-preview" class="hidden w-full h-full object-contain rounded-2xl p-2">
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="button" id="cancel-trade-offer-btn" class="flex-1 py-2.5 glass rounded-xl font-bold hover:-translate-y-0.5 transition-transform">Cancel</button>
        <button type="submit" id="submit-trade-offer-btn" class="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-emerald-500/30">Submit Offer</button>
      </div>
    </form>`;
  setupImageUploadListeners('trade-offer-drop-zone','tradeOfferImageUpload','trade-offer-image-preview','trade-offer-upload-prompt', f => uploadedTradeOfferFile = f);
};

const renderMakeOfferModal = (productId) => {
  uploadedTradeOfferFile = null;
  _initTradeModal(); // pre-renders HTML only once; subsequent calls are instant
  // Reset form and update productId
  const form = document.getElementById('trade-offer-form');
  if (form) {
    form.dataset.productId = productId;
    form.reset();
    document.getElementById('trade-offer-image-preview')?.classList.add('hidden');
    document.getElementById('trade-offer-upload-prompt')?.classList.remove('hidden');
  }
  // Show immediately — no re-render needed
  requestAnimationFrame(() => tradeOfferModal.classList.add('show'));
};

// --- Terms/Privacy Modals ---
const renderTermsModal = () => {
  termsModalContent.innerHTML = `
    <div class="flex flex-col max-h-[85vh]">
      <div class="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
        <h2 class="text-2xl font-black font-syne grad-text-vp">Terms & Conditions</h2>
        <button class="close-policy-modal w-8 h-8 glass rounded-lg flex items-center justify-center hover:text-rose-500 transition-colors">&times;</button>
      </div>
      <div class="p-6 overflow-y-auto text-gray-600 dark:text-gray-300 space-y-4 text-sm leading-relaxed">
        <p class="text-xs text-gray-400">Last updated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
        ${[['Accounts & Conduct','Provide accurate information when signing up. Do not post defamatory, offensive, or obscene content. You are responsible for all content you post.'],['Transactions','ViTMART connects users but is not a party to any transaction. We do not guarantee quality, safety, or legality of items advertised.'],['Prohibited Items','Listing illegal items including weapons, drugs, and stolen goods is strictly prohibited and may result in account termination.'],['Termination','We may terminate access to our service for any reason including breach of these Terms.']].map(([t,d]) => `
          <div class="glass p-4 rounded-xl"><h3 class="font-bold text-gray-900 dark:text-white mb-2">${t}</h3><p>${d}</p></div>`).join('')}
      </div>
      <div class="p-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
        <button class="close-policy-modal px-6 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn">Close</button>
      </div>
    </div>`;
};
const renderPrivacyModal = () => {
  privacyModalContent.innerHTML = `
    <div class="flex flex-col max-h-[85vh]">
      <div class="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
        <h2 class="text-2xl font-black font-syne grad-text-vp">Privacy Policy</h2>
        <button class="close-policy-modal w-8 h-8 glass rounded-lg flex items-center justify-center hover:text-rose-500 transition-colors">&times;</button>
      </div>
      <div class="p-6 overflow-y-auto text-gray-600 dark:text-gray-300 space-y-4 text-sm leading-relaxed">
        <p class="text-xs text-gray-400">Last updated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
        ${[['Information We Collect','We collect your name and email address when you register or interact with our services.'],['How We Use Your Information','To personalize your experience, process transactions securely, and send relevant communications.'],['Data Security','We adopt appropriate security measures to protect against unauthorized access or destruction of your data.'],['Sharing Your Information','We do not sell or rent your personal information. Email is shared only to facilitate transactions you initiate.']].map(([t,d]) => `
          <div class="glass p-4 rounded-xl"><h3 class="font-bold text-gray-900 dark:text-white mb-2">${t}</h3><p>${d}</p></div>`).join('')}
      </div>
      <div class="p-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
        <button class="close-policy-modal px-6 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn">Close</button>
      </div>
    </div>`;
};

// --- Popup Chat ---
const QUICK_CHIPS = [
  '🛒 How to buy', '💰 How to sell', '🔄 How to trade',
  '📌 Noticeboard', '🔔 Notifications', '✨ Recommendations',
  '🤝 Price offers', '⭐ Reviews', '🔍 Lost & Found',
  '🗑️ Manage data', '🔑 Change password', '💬 Support',
];

const renderPopupChat = () => {
  const name = currentUser ? currentUser.displayName.split(' ')[0] : 'there';
  popupChatWidget.innerHTML = `
    <div id="popup-chat-container" class="glass-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-vit-500/20">
      <div class="flex-shrink-0 p-4 border-b border-vit-500/10 flex items-center justify-between bg-gradient-to-r from-vit-600 to-vit-800">
        <div class="flex items-center gap-3">
          <div style="width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px">⚡</div>
          <div>
            <h3 class="text-sm font-bold text-white">ViT Assistant</h3>
            <div class="flex items-center gap-1.5"><div style="width:6px;height:6px;background:#34d399;border-radius:50%"></div><p class="text-xs text-vit-300">Online · 31 topics</p></div>
          </div>
        </div>
        <button id="close-popup-chat-btn" class="text-white/60 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">&times;</button>
      </div>
      <div id="popup-chat-messages" class="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col" style="min-height:0">
        <div class="bot-bubble max-w-[88%] p-3 rounded-2xl rounded-tl-sm text-sm self-start" style="opacity:0;transform:translateY(8px);transition:opacity 0.25s,transform 0.25s">
          Hey <strong>${name}</strong>! ⚡ I'm your campus marketplace guide.<br><br>
          Tap a topic below or type anything naturally.
        </div>
      </div>
      <div class="flex-shrink-0 border-t border-vit-500/10">
        <div id="quick-chips-bar"></div>
        <div class="p-3 pt-0 bg-gray-50 dark:bg-white/2">
          <form id="popup-chat-form" class="flex gap-2">
            <input type="text" id="popup-chat-input" placeholder="Ask me anything about ViTMART…" class="vit-input flex-grow text-sm py-2.5" autocomplete="off">
            <button type="submit" class="p-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl shimmer-btn shadow-lg shadow-vit-500/30 flex-shrink-0">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" transform="rotate(90)"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
    <button id="open-popup-chat-btn" class="w-14 h-14 bg-gradient-to-br from-vit-600 to-vit-700 text-white rounded-2xl shadow-2xl shadow-vit-500/40 flex items-center justify-center shimmer-btn animate-float" style="position:relative">
      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
    </button>`;

  // Animate welcome bubble
  setTimeout(() => {
    const wb = document.querySelector('#popup-chat-messages .bot-bubble');
    if (wb) { wb.style.opacity='1'; wb.style.transform='translateY(0)'; }
  }, 60);

  // Render quick chips
  const bar = document.getElementById('quick-chips-bar');
  if (bar) {
    bar.innerHTML = QUICK_CHIPS.map(c =>
      `<button class="quick-chip" data-chip="${c}">${c}</button>`
    ).join('');
    bar.querySelectorAll('.quick-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('popup-chat-input');
        if (input) { input.value = btn.dataset.chip; }
        // Simulate form submit
        document.getElementById('popup-chat-form')?.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
      });
    });
  }
};

const handlePopupSendMessage = (e) => {
  e.preventDefault();
  const input = document.getElementById('popup-chat-input');
  const msgs = document.getElementById('popup-chat-messages');
  if (!input||!msgs) return;
  const text = input.value.trim();
  if (!text) return;
  const filtered = filterProfanity(text);
  input.value = '';

  // User message bubble
  const userEl = document.createElement('div');
  userEl.className = 'max-w-[80%] p-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-vit-600 to-vit-700 text-white text-sm self-end';
  userEl.style.cssText = 'opacity:0;transform:translateX(10px);transition:opacity 0.15s,transform 0.15s';
  userEl.textContent = filtered;
  msgs.appendChild(userEl);
  msgs.scrollTop = msgs.scrollHeight;
  requestAnimationFrame(() => { userEl.style.opacity='1'; userEl.style.transform='translateX(0)'; });

  // Typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'bot-bubble max-w-[80%] p-3 rounded-2xl rounded-tl-sm text-sm self-start flex items-center gap-1.5';
  typingEl.innerHTML = `<span class="w-2 h-2 bg-vit-400 rounded-full animate-bounce" style="animation-delay:0ms"></span><span class="w-2 h-2 bg-vit-400 rounded-full animate-bounce" style="animation-delay:150ms"></span><span class="w-2 h-2 bg-vit-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>`;
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;

  // Match intent immediately (no delay for matching)
  let reply; let found = false;
  for (const intent of chatbotIntents) {
    for (const kw of intent.keywords) {
      if (filtered.match(kw)) { reply = intent.handler(filtered); found = true; break; }
    }
    if (found) break;
  }
  if (!found) reply = `Hmm, I didn\'t quite catch that. 🤔\n\nTry:\n- **"How do I sell an item?"**\n- **"Find a laptop under ₹8000"**\n- **"How do price offers work?"**\n- **"What is the noticeboard?"**\n\nOr type **help** for the full list.`;

  // Show typing for a natural feel (shorter = snappier)
  const typingDelay = Math.min(400 + reply.length * 0.8, 900);
  setTimeout(() => {
    typingEl.remove();
    const botEl = document.createElement('div');
    botEl.className = 'bot-bubble max-w-[85%] p-3 rounded-2xl rounded-tl-sm text-sm self-start leading-relaxed';
    botEl.style.cssText = 'opacity:0;transform:translateY(6px);transition:opacity 0.2s,transform 0.2s';
    botEl.innerHTML = reply
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-vit-600 dark:text-vit-400">$1</strong>')
      .replace(/\n/g, '<br>');
    msgs.appendChild(botEl);
    msgs.scrollTop = msgs.scrollHeight;
    requestAnimationFrame(() => { botEl.style.opacity='1'; botEl.style.transform='translateY(0)'; });
  }, typingDelay);
};

// --- Auth Logic ---
