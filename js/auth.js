const handleSignUp = async (e) => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  if (password.length < 6) { showMessage('Password must be at least 6 characters.','error'); return; }
  try {
    const uc = await auth.createUserWithEmailAndPassword(email, password);
    await uc.user.updateProfile({displayName:name});
    await db.collection('users').doc(uc.user.uid).set({uid:uc.user.uid,displayName:name,email,photoURL:null,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    await uc.user.sendEmailVerification();
    showMessage('Account created! Check your email to verify.','success');
    renderAuthModal('verify');
  } catch(e) { showMessage(e.message,'error'); }
};

const handleSignIn = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;
  try {
    const uc = await auth.signInWithEmailAndPassword(email, password);
    if (!uc.user.emailVerified) showMessage('Please verify your email to continue.','error');
  } catch(e) { showMessage(e.message,'error'); }
};

const handleResendVerification = async () => {
  const btn = document.getElementById('resend-verification-btn');
  if (!auth.currentUser) { showMessage('No user found. Please sign in again.','error'); renderAuthModal('signin'); return; }
  if (btn?.disabled) return;
  try {
    if (btn) { btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`; }
    await auth.currentUser.sendEmailVerification();
    showMessage('New verification email sent!','success');
  } catch(e) { showMessage(e.code==='auth/too-many-requests'?'Too many requests. Wait before retrying.':`Error: ${e.message}`,'error'); }
  finally { setTimeout(() => { if(btn){btn.disabled=false;btn.innerHTML='Resend Email';} }, 10000); }
};

const handleSignOut = () => showConfirmModal("Are you sure you want to sign out?", () => auth.signOut());

const handleUpdateProfile = async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('profile-name');
  if (!validateInput(nameInput, v=>v.trim().length>0, 'Name cannot be empty.')) return;
  const newName = nameInput.value;
  if (newName===currentUser.displayName) return;
  const btn = document.getElementById('update-profile-btn');
  btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
  try {
    await currentUser.updateProfile({displayName:newName});
    const batch = db.batch();
    batch.update(db.collection('users').doc(currentUser.uid),{displayName:newName});
    const snap = await db.collection('products').where('sellerId','==',currentUser.uid).get();
    snap.docs.forEach(d => batch.update(d.ref,{sellerName:newName}));
    await batch.commit();
    showMessage('Profile updated!','success');
    renderHeaderActions(); renderProfilePage();
  } catch(e) { showMessage('Error: '+e.message,'error'); }
  finally { btn.disabled=false; btn.innerHTML='Save Changes'; }
};

const handleUpdateProfilePicture = async () => {
  const btn = document.getElementById('save-pfp-btn');
  btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
  let photoURL;
  try {
    if (selectedAvatarUrl) photoURL = selectedAvatarUrl;
    else if (uploadedPfpFile) { photoURL = await uploadToCloudinary(uploadedPfpFile); if(!photoURL) throw new Error("Upload failed."); }
    else { showMessage('Select an image or avatar.','error'); return; }
    await currentUser.updateProfile({photoURL});
    await db.collection('users').doc(currentUser.uid).update({photoURL});
    const snap = await db.collection('products').where('sellerId','==',currentUser.uid).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref,{sellerPhotoURL:photoURL}));
    await batch.commit();
    showMessage('Profile picture updated!','success');
    profilePicModal.classList.remove('show');
    renderHeaderActions(); renderProfilePage();
  } catch(e) { showMessage(`Error: ${e.message}`,'error'); }
  finally { btn.disabled=false; btn.innerHTML='Save'; }
};

const handleChangePassword = async (e) => {
  e.preventDefault();
  const cur = document.getElementById('current-password').value;
  const np = document.getElementById('new-password').value;
  const cp = document.getElementById('confirm-password').value;
  if (np!==cp) { showMessage('Passwords do not match.','error'); return; }
  if (np.length<6) { showMessage('New password must be 6+ characters.','error'); return; }
  const btn = document.getElementById('submit-change-password-btn');
  btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, cur);
    await currentUser.reauthenticateWithCredential(cred);
    await currentUser.updatePassword(np);
    showMessage('Password updated!','success');
    changePasswordModal.classList.remove('show');
  } catch(e) { showMessage(`Error: ${e.message}`,'error'); }
  finally { btn.disabled=false; btn.innerHTML='Update Password'; }
};

// --- Product Logic ---
const addProduct = async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('productName');
  const descInput = document.getElementById('description');
  if (!validateInput(nameInput,v=>v.trim().length>2,'Name must be more than 2 characters.')||!validateInput(descInput,v=>v.trim().length>10,'Description must be more than 10 characters.')) { showMessage('Fix errors before submitting.','error'); return; }
  if (!uploadedProductFile) { showMessage('Please upload a product image.','error'); return; }
  const btn = document.getElementById('list-item-btn');
  btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
  try {
    const imageUrl = await uploadToCloudinary(uploadedProductFile);
    if (!imageUrl) { btn.disabled=false; btn.innerHTML='⚡ List My Item'; return; }
    await db.collection('products').add({
      name:nameInput.value, description:descInput.value,
      price:parseFloat(document.getElementById('price').value),
      category:document.getElementById('category').value,
      isTradeable:document.getElementById('isTradeable').checked,
      imageUrl, sellerId:currentUser.uid, sellerName:currentUser.displayName,
      sellerEmail:currentUser.email, sellerPhotoURL:currentUser.photoURL,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(), status:'available'
    });
    showMessage('Item listed!','success');
    e.target.reset();
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('image-upload-prompt').classList.remove('hidden');
    uploadedProductFile = null;
    setActiveTab('my-listings');
  } catch(e) { showMessage(`Error: ${e.message}`,'error'); }
  finally { btn.disabled=false; btn.innerHTML='⚡ List My Item'; }
};

const handleDeleteProduct = (id) => {
  if (!products.find(p=>p.id===id)) return;
  showConfirmModal("Delete this item? This cannot be undone.", async () => {
    try { await db.collection('products').doc(id).delete(); showMessage('Item deleted.','success'); }
    catch(e) { showMessage(`Error: ${e.message}`,'error'); }
  });
};

const handleAddLostAndFoundReport = async (e) => {
  e.preventDefault();
  const title = e.target.querySelector('#lostFoundTitle').value;
  const desc = e.target.querySelector('#lostFoundDescription').value;
  const loc = e.target.querySelector('#lostFoundLocation').value;
  const type = e.target.querySelector('#reportType').value;
  const cp = e.target.querySelector('#lostFoundCollectionPoint')?.value||'';
  if (!title||!desc||!loc||(type==='found'&&!cp)) { showMessage('Fill out all fields.','error'); return; }
  if (!uploadedLostFoundFile) { showMessage('Please upload an image.','error'); return; }
  const btn = e.target.querySelector('#submit-lost-found-btn');
  btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
  try {
    const imageUrl = await uploadToCloudinary(uploadedLostFoundFile);
    if (!imageUrl) throw new Error("Upload failed.");
    await db.collection('lost_and_found').add({
      title,description:desc,location:loc,reportType:type,collectionPoint:cp||null,imageUrl,
      reporterId:currentUser.uid,reporterName:currentUser.displayName,reporterEmail:currentUser.email,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),status:'active'
    });
    showMessage('Report submitted!','success');
    lostAndFoundModal.classList.remove('show');
    uploadedLostFoundFile = null;
  } catch(e) { showMessage(`Error: ${e.message}`,'error'); }
  finally { btn.disabled=false; btn.innerHTML='Submit Report'; }
};

const handleDeleteLostAndFoundItem = (id) => {
  const item = lostAndFoundItems.find(i=>i.id===id);
  if (!item||item.reporterId!==currentUser.uid) return;
  showConfirmModal("Delete this report? This cannot be undone.", async () => {
    try { await db.collection('lost_and_found').doc(id).delete(); showMessage('Report deleted.','success'); }
    catch(e) { showMessage(`Error: ${e.message}`,'error'); }
  });
};

const addToCart = (productId) => {
  if (!currentUser) { showMessage('Sign in to add items to cart.','error'); return; }
  const p = products.find(p=>p.id===productId);
  if (!p||p.status!=='available') { showMessage('Item not available.','error'); return; }
  if (cart[productId]) { showMessage('Already in your cart.','success'); return; }
  showMessage('Added to cart!','success');
  recLog(p, 'cart'); // track cart add for recommendations
  db.collection('carts').doc(currentUser.uid).collection('items').doc(productId).set({
    productId:p.id, name:p.name, price:p.price, imageUrl:p.imageUrl, id:productId, quantity:1,
    sellerId:p.sellerId||'', sellerName:p.sellerName||'', sellerPhotoURL:p.sellerPhotoURL||''
  }).catch(() => showMessage('Failed to add to cart.','error'));
};

const removeFromCart = async (id) => {
  if (!currentUser) return;
  await db.collection('carts').doc(currentUser.uid).collection('items').doc(id).delete();
  showMessage('Removed from cart.','success');
};

const handleCheckout = async () => {
  const btn = document.getElementById('confirm-payment-btn');
  btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
  try {
    await new Promise(r=>setTimeout(r,1500));
    const items = Object.values(cart);
    const total = items.reduce((s,i)=>s+i.price*i.quantity,0);

    // Enrich items with seller info from the products array
    const orderItems = items.map(({id,...rest}) => {
      const p = products.find(x => x.id === (rest.productId || id));
      return {
        ...rest,
        productId: rest.productId || id || '',
        sellerId:      rest.sellerId      || p?.sellerId      || '',
        sellerName:    rest.sellerName    || p?.sellerName    || '',
        sellerPhotoURL:rest.sellerPhotoURL|| p?.sellerPhotoURL|| '',
      };
    });

    // ── Step 1: Write the order document ──────────────────
    const orderRef = db.collection('orders').doc();
    const orderId  = orderRef.id;
    await orderRef.set({
      userId: currentUser.uid,
      userName: currentUser.displayName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      total,
      items: orderItems,
    });

    // ── Step 2: Clear cart ─────────────────────────────────
    const cartSnap = await db.collection('carts').doc(currentUser.uid).collection('items').get();
    const cartBatch = db.batch();
    cartSnap.forEach(d => cartBatch.delete(d.ref));
    await cartBatch.commit();

    // ── Step 3: Mark products sold (best-effort — Firestore rules
    //           require buyer to be allowed to update status) ─────
    await Promise.allSettled(
      items.map(item =>
        db.collection('products').doc(item.id || item.productId)
          .update({ status: 'sold' })
          .catch(err => console.warn(`Could not mark ${item.id} sold:`, err.message))
      )
    );

    // ── Step 4: Create chat rooms per seller ───────────────
    const sellersSeen = new Set();
    for (const item of orderItems) {
      if (!item.sellerId || item.sellerId === currentUser.uid) continue;
      if (sellersSeen.has(item.sellerId)) continue;
      sellersSeen.add(item.sellerId);
      const chatId   = `${orderId}_${item.sellerId}`;
      const chatItem = orderItems.find(i => i.sellerId === item.sellerId);
      await db.collection('chats').doc(chatId).set({
        orderId,
        buyerId:      currentUser.uid,
        buyerName:    currentUser.displayName || 'Buyer',
        buyerPhoto:   currentUser.photoURL    || '',
        sellerId:     item.sellerId,
        sellerName:   item.sellerName   || 'Seller',
        sellerPhoto:  item.sellerPhotoURL|| '',
        productName:  chatItem?.name    || 'Item',
        productImage: chatItem?.imageUrl|| '',
        productId:    chatItem?.productId|| '',
        lastMessage:  '',
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
        unreadBuyer:  0,
        unreadSeller: 0,
      }).catch(err => console.warn('Chat room creation failed:', err.message));
    }

    // ── Done ───────────────────────────────────────────────
    checkoutModal.classList.remove('show');
    triggerConfetti();
    showMessage('Purchase complete! 🎉 Redirecting to your orders…', 'success');
    if (window._afterCheckoutNotify) window._afterCheckoutNotify(items);
    items.forEach(item => { const bp = products.find(p=>p.id===item.id||p.id===item.productId); if(bp) recLog(bp,'buy'); });
    setTimeout(() => setActiveTab('orders'), 1200);

  } catch(e) {
    console.error('Checkout error:', e);
    showMessage('Payment failed: ' + (e.message || e.code || 'Unknown error. Check your connection.'), 'error');
  } finally {
    btn.disabled=false; btn.innerHTML='Pay Now';
  }
};

// --- Trade Logic ---
const handleTradeOfferSubmit = async (e) => {
  e.preventDefault();
  const productId = e.target.dataset.productId;
  const text = e.target.querySelector('#tradeOfferText').value;
  if (!text.trim()) { showMessage('Describe your offer.','error'); return; }
  const btn = e.target.querySelector('#submit-trade-offer-btn');
  btn.disabled=true; btn.innerHTML=`<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>`;
  try {
    let img = null;
    if (uploadedTradeOfferFile) img = await uploadToCloudinary(uploadedTradeOfferFile);
    await db.collection('products').doc(productId).collection('offers').add({
      offerText:filterProfanity(text), offerImageUrl:img,
      offererId:currentUser.uid, offererName:currentUser.displayName,
      offererEmail:currentUser.email, offererPhotoURL:currentUser.photoURL,
      status:'pending', createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    // Notify the seller directly
    const tradeProd = products.find(p => p.id === productId);
    if (tradeProd && tradeProd.sellerId && tradeProd.sellerId !== currentUser.uid) {
      sendNotification(tradeProd.sellerId, {
        type: 'trade_offer',
        title: '🔄 New Trade Offer!',
        body: `${currentUser.displayName || 'Someone'} sent a trade offer on "${tradeProd.name}".`,
        productId
      });
    }
    showMessage('Trade offer submitted!','success');
    tradeOfferModal.classList.remove('show');
  } catch(e) { showMessage(`Error: ${e.message}`,'error'); }
  finally { btn.disabled=false; btn.innerHTML='Submit Offer'; }
};

const renderSellerOffersView = (productId) => {
  const c = document.getElementById('offers-section');
  if (!c) return;
  c.innerHTML = `<div class="glass p-6 rounded-2xl"><h3 class="text-xl font-black font-syne text-gray-900 dark:text-white mb-4">Received Trade Offers</h3><div id="offers-list" class="space-y-4"><p class="text-gray-400">Loading offers...</p></div></div>`;
  const list = document.getElementById('offers-list');
  offersUnsubscribe = db.collection('products').doc(productId).collection('offers').orderBy('createdAt','desc').onSnapshot(snap => {
    if (snap.empty) { list.innerHTML=`<p class="text-gray-400">No offers received yet.</p>`; return; }
    list.innerHTML = '';
    snap.docs.forEach(doc => {
      const o = {id:doc.id,...doc.data()};
      const oc = document.createElement('div');
      oc.className = 'glass p-4 rounded-xl';
      const badge = o.status==='accepted' ? `<span class="px-2 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">Accepted</span>`
        : o.status==='rejected' ? `<span class="px-2 py-1 text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full">Rejected</span>`
        : `<span class="px-2 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">Pending</span>`;
      oc.innerHTML = `
        <div class="flex justify-between items-start gap-4">
          <div class="flex items-start gap-3">
            <img src="${o.offererPhotoURL||'https://placehold.co/40x40/e8e0ff/7c3aed?text=?'}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0">
            <div><p class="font-bold text-sm">${o.offererName}</p><p class="text-gray-600 dark:text-gray-300 text-sm mt-0.5">${o.offerText}</p></div>
          </div>
          ${badge}
        </div>
        ${o.offerImageUrl?`<img src="${o.offerImageUrl}" class="mt-3 max-w-[140px] max-h-[140px] rounded-xl object-cover border border-gray-200 dark:border-gray-700">`:'' }
        ${o.status==='pending'?`<div class="mt-4 flex gap-3"><button class="reject-offer-btn px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl hover:-translate-y-0.5 transition-transform" data-offer-id="${o.id}" data-product-id="${productId}">Reject</button><button class="accept-offer-btn px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:-translate-y-0.5 transition-transform" data-offer-id="${o.id}" data-product-id="${productId}" data-offerer-id="${o.offererId}">Accept</button></div>`:''}`;
      list.appendChild(oc);
    });
  });
};

const handleAcceptOffer = async (offerId, productId, offererId) => {
  showConfirmModal("Accept this offer? Item will be marked as Traded.", async () => {
    const pr = db.collection('products').doc(productId);
    const or = pr.collection('offers').doc(offerId);
    try {
      const product = products.find(p => p.id === productId);
      const batch = db.batch();
      batch.update(pr, {status:'traded'});
      batch.update(or, {status:'accepted'});
      // Reject remaining pending offers
      const pendingSnap = await pr.collection('offers').where('status','==','pending').get();
      pendingSnap.forEach(d => { if (d.id!==offerId) batch.update(d.ref,{status:'rejected'}); });
      // Create an order record for the seller so trade appears in My Orders
      if (product) {
        const orderRef = db.collection('orders').doc();
        batch.set(orderRef, {
          userId: currentUser.uid,
          userName: currentUser.displayName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          total: 0,
          orderType: 'trade',
          items: [{
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl || '',
            quantity: 1
          }]
        });
      }
      // Notify the offerer that their trade was accepted
      await sendNotification(offererId, {
        type: 'trade_accepted',
        title: '🔄 Trade Offer Accepted!',
        body: product ? `Your trade offer for "${product.name}" was accepted by the seller.` : 'Your trade offer was accepted!',
        productId
      });
      await batch.commit();
      showMessage('Offer accepted! Item marked as traded.','success');
    } catch(e) { showMessage(`Error: ${e.message}`,'error'); }
  });
};

const handleRejectOffer = async (offerId, productId) => {
  try { await db.collection('products').doc(productId).collection('offers').doc(offerId).update({status:'rejected'}); showMessage('Offer rejected.','success'); }
  catch(e) { showMessage(`Error: ${e.message}`,'error'); }
};

// --- Upload Helpers ---
