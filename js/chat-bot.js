const campusBot = {
  displayName: 'ViT Assistant',
  photoURL: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%237c3aed%22/%3E%3Ctext x=%2250%22 y=%2268%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22%3E⚡%3C/text%3E%3C/svg%3E',
};

const chatbotIntents = [
  // ── GREETINGS ────────────────────────────────────────────
  { name:'greeting',
    keywords:[/^hey\b/i,/^hello\b/i,/^hi\b/i,/^yo\b/i,/^sup\b/i,/^hii/i,/^namaste/i,/^wassup/i,/^howdy/i],
    handler:()=>{ const n=currentUser?`, ${currentUser.displayName.split(' ')[0]}`:''; return `Hello${n}! ⚡ I'm **ViT Assistant** — your campus marketplace guide.\n\n💡 **Quick questions to try:**\n- "How do I sell something?"\n- "Find a laptop under ₹8000"\n- "What is the noticeboard?"\n- "How do price offers work?"\n- "Show me trending items"\n- "What are my orders?"\n\nOr just type naturally!`; }
  },

  // ── ABOUT ────────────────────────────────────────────────
  { name:'about',
    keywords:[/what is vitmart/i,/about vitmart/i,/tell me about/i,/how does vitmart work/i,/what does vitmart do/i,/what is this (site|app|platform)/i],
    handler:()=>`**ViTMART** is a student-exclusive campus marketplace.\n\n🛒 **Buy** used items from fellow students\n💰 **Sell** things you no longer need\n🔄 **Trade/Barter** — swap items, no money needed\n📌 **Noticeboard** — post what you want or need\n🔍 **Lost & Found** — campus bulletin board\n⭐ **Reviews** — rate your experience\n✨ **Recommendations** — personalised picks for you\n\nAll transactions happen **in person on campus** — no shipping, no fees!`
  },

  // ── NAVIGATION ───────────────────────────────────────────
  { name:'navigate',
    keywords:[/take me to/i,/go to/i,/^open /i,/navigate to/i,/show me the/i,/switch to/i,/i want to (see|visit)/i],
    handler:(msg)=>{
      const m=msg.toLowerCase();
      const routes=[
        {words:['home','main page'],tab:'home',label:'🏠 **Home**'},
        {words:['buy','shop','browse','marketplace','store'],tab:'buy',label:'🛒 **Buy**'},
        {words:['sell','list','create listing'],tab:'sell',label:'💰 **Sell**'},
        {words:['trade','barter','swap','exchange'],tab:'trade',label:'🔄 **Trade**'},
        {words:['lost','found','l&f'],tab:'lost-and-found',label:'🔍 **Lost & Found**'},
        {words:['my listing','my items','my product'],tab:'my-listings',label:'📋 **My Listings**',auth:true},
        {words:['order','purchase','bought'],tab:'orders',label:'📦 **My Orders**',auth:true},
        {words:['profile','account','settings'],tab:'profile',label:'👤 **Profile**',auth:true},
        {words:['review','rating'],tab:'reviews',label:'⭐ **Reviews**'},
        {words:['noticeboard','board','notice','bulletin'],tab:'noticeboard',label:'📌 **Noticeboard**'},
        {words:['manage','cleanup','delete history'],tab:'manage',label:'🗑️ **Manage**'},
      ];
      for(const r of routes){
        if(r.words.some(w=>m.includes(w))){
          if(r.auth&&!currentUser) return `Please **sign in** first to access ${r.label}.`;
          setActiveTab(r.tab); closeChatUI();
          return `Opening ${r.label} for you! ✨`;
        }
      }
      return `I can take you to:\n**Home · Buy · Sell · Trade · Lost & Found**\n**My Listings · My Orders · Profile · Reviews**\n**Noticeboard · Manage**\n\nWhere would you like to go?`;
    }
  },

  // ── SELL ─────────────────────────────────────────────────
  { name:'how_to_sell',
    keywords:[/how (do|can|to) (i |we )?sell/i,/how (do|can|to) (i |we )?list/i,/list an item/i,/post an item/i,/create a listing/i,/sell page/i,/listing process/i,/start selling/i],
    handler:()=>{ setActiveTab('sell'); closeChatUI(); return `To **list an item** for sale:\n\n1️⃣ Upload a clear photo\n2️⃣ Fill in name, description & price\n3️⃣ Pick a category\n4️⃣ Set a price — or enable **🤝 Price Offers** so buyers can negotiate\n5️⃣ Check ✅ **Accept Trade Offers** to allow barter\n6️⃣ Hit **⚡ List My Item**\n\n✅ Goes live instantly in Buy & My Listings!\n\n💡 **Tip:** Clear photos & honest descriptions = faster sales.`; }
  },

  // ── BUY ──────────────────────────────────────────────────
  { name:'how_to_buy',
    keywords:[/how (do|can|to) (i |we )?buy/i,/how (do|can|to) (i |we )?purchase/i,/buying process/i,/add to cart/i,/checkout process/i,/how to checkout/i],
    handler:()=>{ setActiveTab('buy'); closeChatUI(); return `To **buy an item**:\n\n1️⃣ Browse the Buy page (opened!)\n2️⃣ Use **filters** — category, price range, sort\n3️⃣ Click any item for full details\n4️⃣ **Add to Cart** 🛒 or **Make a Price Offer** 🤝\n5️⃣ Open cart (top-right) → **Checkout**\n6️⃣ Contact seller from **My Orders** to arrange meetup\n\n💡 **Price Offers** let you negotiate — the seller can accept, counter, or decline!`; }
  },

  // ── TRADE ────────────────────────────────────────────────
  { name:'how_to_trade',
    keywords:[/how (do|can|to) (i |we )?trade/i,/how (do|can|to) (i |we )?barter/i,/trade offer/i,/what is (the )?trade/i,/trade page/i,/barter page/i,/make (a )?trade offer/i,/swap items/i],
    handler:()=>{ setActiveTab('trade'); closeChatUI(); return `**Trading on ViTMART** — swap items without cash:\n\n1️⃣ Browse **Trade** page (opened!) — only 🔄 Tradeable items show here\n2️⃣ Click any item → **Make a Trade Offer**\n3️⃣ Describe what you're offering + optional photo\n4️⃣ Seller sees your offer on their listing\n✅ If accepted, arrange a campus meetup!\n\n💡 To make **your listing tradeable** — check ✅ "Accept Trade Offers" on the Sell page.\n\n📦 Accepted trades appear in your **My Orders** tab too!`; }
  },

  // ── PRICE OFFERS / NEGOTIATION ───────────────────────────
  { name:'price_offer',
    keywords:[/price offer/i,/make (a |an )?offer/i,/negotiate/i,/counter offer/i,/haggle/i,/bargain/i,/offer (a )?price/i,/can i negotiate/i,/can i bargain/i],
    handler:()=>`**Price Negotiation on ViTMART:**\n\n🤝 On any product detail page, click **"Make a Price Offer"** to propose your own price.\n\n**How it works:**\n1️⃣ Buyer sends an offer with optional message\n2️⃣ Seller sees it in the **Price Offers Received** section\n3️⃣ Seller can:\n   ✅ **Accept** — deal confirmed!\n   💬 **Counter** — suggest a different price\n   ❌ **Decline** — offer rejected\n4️⃣ If countered, buyer can accept or decline the counter\n\n💡 **Counter offers never change the public listing price** — only you and the seller see the negotiation.`
  },

  // ── NOTICEBOARD ──────────────────────────────────────────
  { name:'noticeboard',
    keywords:[/noticeboard/i,/notice board/i,/what is the board/i,/bulletin board/i,/post a request/i,/looking for something/i,/want to buy/i,/wanna buy/i,/notice/i,/board/i,/community post/i],
    handler:()=>{ setActiveTab('noticeboard'); closeChatUI(); return `**📌 Noticeboard** — the campus bulletin board (opened!):\n\n**Post 4 types of notices:**\n🛒 **Want to Buy** — "Looking for a Python textbook"\n💰 **Selling** — "Selling my semester notes"\n🙋 **Need Help** — "Need someone to tutor DSA"\n📢 **General** — Anything else!\n\n**Anyone can reply** to your notice in real-time.\nGreat for finding specific items that aren't listed yet!`; }
  },

  // ── NOTIFICATIONS ────────────────────────────────────────
  { name:'notifications',
    keywords:[/notification/i,/bell/i,/alert/i,/how do i know/i,/will i be notified/i,/get notified/i,/notification system/i],
    handler:()=>`**🔔 Notifications on ViTMART:**\n\nThe bell icon 🔔 in the top header shows real-time alerts for:\n\n🛒 **Purchase** — someone bought your item\n🔄 **Trade offer** — someone sent you a trade offer\n💰 **Price offer** — someone offered a price on your item\n✅ **Trade accepted** — your trade offer was accepted\n\n**Click any notification** to jump straight to the relevant item.\n\n✉️ Unread count shows as a red badge on the bell. Click **"Mark all read"** to clear.`
  },

  // ── RECOMMENDATIONS ──────────────────────────────────────
  { name:'recommendations',
    keywords:[/recommendation/i,/personalised/i,/for me/i,/suggest/i,/what should i buy/i,/trending/i,/popular/i,/what.s good/i,/any suggestions/i],
    handler:()=>{
      const hist=JSON.parse(localStorage.getItem('vm_rec_events')||'[]');
      if(!hist.length) return `**✨ Personalised Recommendations:**\n\nStart browsing, wishlisting, or buying items — the more you interact, the better your recommendations get!\n\nRecommendations appear on the **Buy page** and **Home page** and are based on:\n📂 Category preferences\n💰 Your price range\n🔍 Keywords you search\n❤️ Items you wishlist\n🛒 Things you buy\n\nThey update every time you interact with the site!`;
      const recs=getRecommendations(3);
      const recText=recs.length ? recs.map(p=>`• **${p.name}** — ₹${p.price?.toFixed(0)||'?'} (${p.category})`).join('\n') : 'No new recommendations right now.';
      return `**✨ Your Top Picks right now:**\n\n${recText}\n\nSee all recommendations on the **Buy page** → scroll down for "Recommended For You"!`;
    }
  },

  // ── LOST & FOUND ─────────────────────────────────────────
  { name:'lost_found',
    keywords:[/lost.?found/i,/lost (my |an |a )?item/i,/found (an |a )?item/i,/report lost/i,/report found/i,/lost my/i,/i found/i,/l&f/i,/missing item/i],
    handler:()=>{ setActiveTab('lost-and-found'); closeChatUI(); return `**🔍 Lost & Found** (opened!):\n\n😢 **Lost something?**\n→ "Report Lost" → add photo, description & last seen location\n→ Students contact you via email if they find it\n\n🎉 **Found something?**\n→ "Report Found" → add where you found it & collection point\n→ Owner contacts you to claim it\n\n✅ Mark as **Resolved** once the item is returned!`; }
  },

  // ── REVIEWS ──────────────────────────────────────────────
  { name:'reviews',
    keywords:[/review/i,/rating/i,/rate (a |the )?seller/i,/write (a )?review/i,/leave (a )?feedback/i,/feedback/i,/star/i],
    handler:()=>{ setActiveTab('reviews'); closeChatUI(); return `**⭐ Reviews** (opened!):\n\nShare honest feedback about sellers, items, or the platform.\n\n**How to post a review:**\n1️⃣ Pick a rating (1–5 stars)\n2️⃣ Enter what it's about (seller name, item, etc.)\n3️⃣ Write your experience\n4️⃣ Optional: post **anonymously**\n\n**Deleting:** You can delete your own reviews.\n\n💡 Reviews are **immutable** — you can't edit once posted, only delete.`; }
  },

  // ── MY LISTINGS ──────────────────────────────────────────
  { name:'my_listings',
    keywords:[/my listing/i,/my items/i,/items (i.m|i am) selling/i,/what am i selling/i,/my product/i,/view my listing/i,/items i.ve listed/i,/how many (items|listings)/i],
    handler:()=>{
      if(!currentUser) return "You need to be **signed in** to view your listings.";
      const ml=products.filter(p=>p.sellerId===currentUser.uid);
      const av=ml.filter(p=>p.status==='available').length;
      const sold=ml.filter(p=>p.status==='sold').length;
      const traded=ml.filter(p=>p.status==='traded').length;
      setActiveTab('my-listings'); closeChatUI();
      if(!ml.length) return "You haven't listed anything yet!\n\nHead to **Sell** to create your first listing. 🚀";
      return `Your listings summary:\n✅ **${av}** active\n💰 **${sold}** sold\n🔄 **${traded}** traded\n📦 **${ml.length}** total\n\nOpening **My Listings**!`;
    }
  },

  // ── MY ORDERS ────────────────────────────────────────────
  { name:'my_orders',
    keywords:[/my order/i,/order history/i,/my purchase/i,/what (i.ve|have i) bought/i,/past order/i,/previous order/i,/order (list|tab)/i,/placed order/i],
    handler:()=>{
      if(!currentUser) return "Please **sign in** to view your orders.";
      setActiveTab('orders'); closeChatUI();
      if(!orders.length) return "No orders yet!\n\nHead to **Buy** to find something great. 🛒\nOpened the Buy page for you!";
      return `You have **${orders.length}** order(s).\n\nOpening **My Orders** — you can also contact sellers directly from there!`;
    }
  },

  // ── SEARCH ───────────────────────────────────────────────
  { name:'search',
    keywords:[/^find /i,/^search /i,/^look for /i,/^do you have /i,/^is there /i,/^show (me )?items/i,/^any /i,/^looking for /i,/^i need a /i,/^i want a /i],
    handler:(msg)=>{
      const priceMatch=msg.match(/(under|below|less than|over|above|more than)\s*(?:rs\.?|₹|inr)?\s*(\d+)/i);
      let query=msg.replace(/^(find|search for|search|look for|do you have|is there|any|show me items for|show items|looking for|i need a|i need an|i want a|i want an)\s+(a|an|any|some)?\s*/i,'').trim();
      if(priceMatch) query=query.replace(priceMatch[0],'').trim();
      if(!query||query.length<2) return "What are you looking for?\n\nExample: **find a physics textbook** or **search laptop under ₹15000**";
      setActiveTab('buy');
      setTimeout(()=>{
        const s=document.querySelector('#buy-tab #search-input');
        if(s){s.value=query;s.dispatchEvent(new Event('input'));}
        if(priceMatch){
          const pf=document.querySelector('#buy-tab #filter-price');
          const cond=priceMatch[1].toLowerCase();const amt=parseInt(priceMatch[2]);
          if(pf){
            if(['under','below','less than'].includes(cond)){
              if(amt<=500)pf.value='0-500';
              else if(amt<=2000)pf.value='500-2000';
              else if(amt<=5000)pf.value='2000-5000';
              else pf.value='all';
            }else{pf.value='5000-9999999';}
            pf.dispatchEvent(new Event('change'));
          }
        }
      },150);
      closeChatUI();
      return `🔍 Searching for **"${query}"**...`;
    }
  },

  // ── CATEGORIES ───────────────────────────────────────────
  { name:'categories',
    keywords:[/what categor/i,/what type(s)? of item/i,/what can i (buy|find|sell|get)/i,/types of item/i,/category list/i,/available categor/i,/what.s (available|on sale)/i],
    handler:()=>`**ViTMART Categories:**\n\n📚 Books  💻 Electronics  🛋️ Furniture\n👕 Clothing  ✏️ Stationery  ⚽ Sports Gear\n🤝 Services  🎟️ Event Tickets  📦 Other\n\nUse **category + price filters** on the Buy/Trade pages.\nOr ask me: **"find Electronics under ₹5000"** and I'll search for you!`
  },

  // ── EDIT PRICE ───────────────────────────────────────────
  { name:'edit_price',
    keywords:[/edit price/i,/change price/i,/update price/i,/change (my )?listing price/i,/how (to|do i) change.*price/i,/lower (the )?price/i,/reduce price/i],
    handler:()=>{ if(!currentUser) return "Please **sign in** to edit your listings."; setActiveTab('my-listings'); closeChatUI(); return `To **change a listing price**:\n\n1️⃣ Go to **My Listings** (opened!) or the product detail page\n2️⃣ Click the **✏️ Edit Price** button below the price\n3️⃣ Enter the new price — a live preview shows the % change\n4️⃣ Confirm\n\n✅ Price updates instantly for all buyers!\n\n💡 The edit price button is for **your own listings only** — counter offers let you negotiate prices with individual buyers.`; }
  },

  // ── MANAGE / CLEANUP ─────────────────────────────────────
  { name:'manage',
    keywords:[/manage/i,/cleanup/i,/delete (old|my) listing/i,/clear (order )?history/i,/delete history/i,/how (to|do i) delete.*history/i,/remove old/i],
    handler:()=>{ if(!currentUser) return "Please **sign in** to manage your data."; setActiveTab('manage'); closeChatUI(); return `**🗑️ Manage & Cleanup** (opened!):\n\nFrom here you can:\n📦 **Bulk-delete** old sold/traded listings\n🧾 **Clear order history**\n❤️ **Manage wishlist** — remove individual items or wipe all\n🔍 **Clear browse history** (resets recommendations)\n⚠️ **Danger Zone** — delete all listings or all local data\n\nAll destructive actions ask for confirmation first.`; }
  },

  // ── PAYMENT ──────────────────────────────────────────────
  { name:'payment',
    keywords:[/how (do|can) (i |we )?pay/i,/payment/i,/upi/i,/how (does|do) payment/i,/payment method/i,/pay for/i,/how to pay/i,/cash/i,/google pay/i,/gpay/i,/phonepay/i,/paytm/i],
    handler:()=>`**Payments on ViTMART:**\n\n💳 The checkout shows UPI & card fields *(currently simulated — no real charge)*\n\n💵 **Real payment** happens in person when you meet the seller:\n— Cash, UPI, GPay, PhonePay, Paytm — whatever you both agree on\n\n🤝 ViTMART connects you; the final payment is between you two.\n\n💡 **Pro tip:** Confirm the meetup location and payment method via email before meeting!`
  },

  // ── SAFETY ───────────────────────────────────────────────
  { name:'safety',
    keywords:[/safe/i,/scam/i,/fraud/i,/is it safe/i,/how (to stay|to be) safe/i,/trust/i,/fake/i,/suspicious/i,/report (a )?user/i,/block (a )?user/i],
    handler:()=>`**Staying safe on ViTMART:**\n\n🏫 Meet **on campus** — library, student union, cafeteria\n👥 Bring a friend if uncertain\n📱 Check the seller's profile — reviews & transaction history\n🚫 **Never pay before seeing the item in person**\n📧 All contact goes via verified student emails\n✅ ViTMART is exclusive to verified VIT students only\n\n⚠️ If you suspect fraud, email: **swastiksinha001@gmail.com**`
  },

  // ── WISHLIST ─────────────────────────────────────────────
  { name:'wishlist',
    keywords:[/wishlist/i,/save (an |the )?item/i,/saved item/i,/favorit/i,/favourit/i,/heart (icon|button)/i,/bookmark/i,/how (to|do i) save/i],
    handler:()=>{
      const wl=JSON.parse(localStorage.getItem('vitmart_wishlist')||'[]');
      const count=wl.length;
      return `**❤️ Wishlist:**\n\nClick the heart ❤️ on any product card to save it.\n\n${count>0?`You currently have **${count} item(s)** wishlisted.`:'Your wishlist is empty right now.'}\n\n💡 **Tips:**\n— Wishlisted items boost your recommendations\n— Manage your wishlist in **🗑️ Manage** tab\n— Saved items persist even after closing the browser`;
    }
  },

  // ── ACCOUNT ──────────────────────────────────────────────
  { name:'account_settings',
    keywords:[/change password/i,/update (my )?name/i,/change (my )?(name|email|photo|picture|avatar|profile)/i,/update profile/i,/edit profile/i,/account setting/i,/profile setting/i,/how (to|do i) change.*name/i],
    handler:()=>{ if(!currentUser) return "Please **sign in** to access account settings."; setActiveTab('profile'); closeChatUI(); return `**👤 Your Profile** (opened!):\n\nYou can:\n✏️ Change your **display name**\n🖼️ Update **profile picture** or pick an avatar\n🔑 Change **password** (Security section)\n📧 Your email: ${currentUser.email}\n\n💡 All changes sync instantly — your name updates on all your listings too!`; }
  },

  // ── DARK MODE ────────────────────────────────────────────
  { name:'dark_mode',
    keywords:[/dark mode/i,/light mode/i,/toggle (theme|mode|dark|light)/i,/switch (to )?(dark|light)/i,/change theme/i,/night mode/i,/enable dark/i,/disable dark/i],
    handler:()=>{ toggleTheme(); return `Switched to **${document.documentElement.classList.contains('dark')?'Dark 🌙':'Light ☀️'} Mode**!\n\nYou can also click the **moon/sun icon** in the header anytime to toggle.`; }
  },

  // ── VERIFICATION ─────────────────────────────────────────
  { name:'verification',
    keywords:[/verif/i,/email (not )?verif/i,/didn.t get (the )?email/i,/resend (the )?email/i,/verification link/i,/verify (my )?email/i,/no email/i,/email not coming/i],
    handler:()=>`**Email verification help:**\n\n1️⃣ Check your **spam / junk** folder first\n2️⃣ On the verification screen, click **"Resend Email"**\n3️⃣ Wait 1–2 minutes, then click the link\n\n✅ The page **auto-detects** when you've verified — no refresh needed!\n\n💡 If still stuck, try signing in again — it will re-show the verification screen.`
  },

  // ── SUPPORT ──────────────────────────────────────────────
  { name:'support',
    keywords:[/contact support/i,/help desk/i,/email support/i,/report a problem/i,/issue/i,/bug/i,/problem with (the )?site/i,/something (is )?broken/i,/admin/i,/contact (the )?admin/i,/how (to|do i) report/i],
    handler:()=>`**📧 Support:**\n\nEmail the admin: **swastiksinha001@gmail.com**\n\nDescribe your issue clearly — include your registered email and what happened.\n\nResponse within **24 hours** on weekdays.\n\nYou can also click **"Contact Support"** in the footer.`
  },

  // ── KEYBOARD SHORTCUTS ───────────────────────────────────
  { name:'shortcuts',
    keywords:[/keyboard shortcut/i,/command palette/i,/ctrl.?k/i,/cmd.?k/i,/quick (search|access)/i,/shortcut/i,/⌘k/i],
    handler:()=>`**⌨️ Keyboard Shortcuts:**\n\n**⌘K / Ctrl+K** — Open command palette\n— Search any page, product, or action\n— Navigate without using the mouse\n\n**ESC** — Close any modal or palette\n**↑ ↓** — Navigate palette results\n**↵** — Select highlighted item\n\nThe command palette also shows your recent products!`
  },

  // ── STATUS OF ITEM ───────────────────────────────────────
  { name:'item_status',
    keywords:[/what (does|is) (sold|traded|available|pending) mean/i,/item (status|states)/i,/what (do|does) the (status|badge|tag) mean/i,/sold badge/i,/traded badge/i],
    handler:()=>`**Item Status Meanings:**\n\n✅ **Available** — Listed & ready to buy/trade\n💰 **Sold** — Purchased by a buyer\n🔄 **Traded** — Swapped via a trade offer\n⏳ **Pending** — Reserved / transaction in progress\n\n**Trade badges:**\n🔄 — Item accepts trade offers\n\n**Offer statuses:**\n⏳ Pending → waiting for seller\n✅ Accepted → deal done!\n❌ Rejected → declined\n💬 Countered → seller sent a different price`
  },

  // ── HOW REC WORKS ────────────────────────────────────────
  { name:'how_rec_works',
    keywords:[/how (do|does|do) (the )?recommendation(s)? work/i,/why (is|are) this (recommended|showing)/i,/how (does|do) it know/i,/personalisation/i,/recommendation engine/i,/why (are|is) you recommending/i],
    handler:()=>`**✨ How Recommendations Work:**\n\nViTMART learns from your behaviour:\n\n👁️ **Views** — items you look at (low weight)\n❤️ **Wishlist saves** — stronger signal\n🛒 **Cart adds** — strong signal\n💰 **Purchases** — strongest signal\n⭐ **Reviews you write** — medium weight\n\n**Recency decay** — recent activity counts more than old.\n\n**Diversity** — max 2 items per category, max 2 per seller, so you always see variety.\n\n**Price range** — learns your typical budget and boosts items in that range.\n\nThe more you interact, the better it gets! 🎯`
  },

  // ── PRICE HISTORY ───────────────────────────────────────
  { name:'price_history',
    keywords:[/price history/i,/price change/i,/how (has|did) (the )?price (change|drop|increase)/i,/original price/i,/was (the )?price different/i],
    handler:()=>`**💹 Price History:**\n\nSellers can update their listing price anytime using the **✏️ Edit Price** button on their product detail page.\n\nWhen a seller edits the price:\n— The new price is updated instantly for all buyers\n— The old price is stored as \`lastPriceUpdate\` timestamp\n— Counter offers (from negotiations) never change the listed price — they're private\n\n💡 If you see a price you think is too high, use **"Make a Price Offer"** to negotiate!`
  },

  // ── PROFILE PICTURE ──────────────────────────────────────
  { name:'profile_picture',
    keywords:[/profile picture/i,/profile photo/i,/change (my )?(picture|photo|avatar|pic|pfp)/i,/update (my )?(picture|photo|avatar|pic|pfp)/i,/how (to|do i) (set|change|update) (my )?(avatar|photo|picture)/i],
    handler:()=>{ if(!currentUser) return "Please **sign in** first to update your profile."; setActiveTab('profile'); closeChatUI(); return `To **change your profile picture** (opened Profile!):\n\n1️⃣ Click **"Change Picture"** on your profile page\n2️⃣ Choose one of three options:\n   📤 **Upload** your own photo\n   🎨 **Pick an avatar** from the gallery\n3️⃣ Click **Save**\n\n✅ Your picture updates on all your listings automatically!`; }
  },

  // ── CART ─────────────────────────────────────────────────
  { name:'cart',
    keywords:[/cart/i,/shopping cart/i,/what.s in (my )?cart/i,/how (to|do i) (view|open|see) (my )?cart/i,/add to cart/i,/remove from cart/i,/cart is empty/i],
    handler:()=>{
      const cartCount = Object.keys(cart).length;
      return `**🛒 Your Shopping Cart:**\n\nYou currently have **${cartCount} item(s)** in your cart.\n\n📍 Access the cart by clicking the **cart icon** (top-right header)\n\n**In the cart you can:**\n— See all added items & prices\n— Remove individual items ✕\n— See the running total\n— Click **Proceed to Checkout** to complete purchase\n\n💡 Cart items are synced across devices via your account!`;
    }
  },

  // ── SELLER CONTACT ────────────────────────────────────────
  { name:'seller_contact',
    keywords:[/contact (the )?seller/i,/how (do|to) (i |we )?contact/i,/reach (the )?seller/i,/talk to seller/i,/seller email/i,/message (the )?seller/i,/get in touch/i],
    handler:()=>`**📧 Contacting a Seller:**\n\n**After buying:**\n1️⃣ Go to **My Orders**\n2️⃣ Click **"Contact Seller"** next to the item\n3️⃣ A pre-filled email opens — just add your message!\n\n**Before buying:**\n— Open the product detail page\n— You'll see the seller's name\n— Go to **My Orders** after purchase to get their email\n\n🤝 Most sellers arrange campus meetups at:\n📍 Library, Cafeteria, Hostels, Academic blocks`
  },

  // ── CAMPUS MEETUP ─────────────────────────────────────────
  { name:'meetup',
    keywords:[/meetup/i,/meet up/i,/where (to|do) (we |i )?meet/i,/pickup (location|spot|place)/i,/collection point/i,/how (do|to) (i |we )?collect/i,/campus (location|spot)/i,/arrange (a )?meetup/i],
    handler:()=>`**🏫 Campus Meetup Tips:**\n\nAll ViTMART transactions happen in person on campus!\n\n**Good meetup spots:**\n📚 Main Library lobby\n☕ Cafeteria / Mess areas\n🏛️ Academic Block corridors\n🏠 Hostel common areas\n\n**Arrange it via email** (from My Orders → Contact Seller)\n\n✅ **Safety tips:**\n— Meet during daytime\n— Bring the exact amount\n— Test electronics before paying\n— Screenshot the listing before meeting`
  },

  // ── MULTIPLE ITEMS ───────────────────────────────────────
  { name:'bulk_buy',
    keywords:[/buy (multiple|more than one|several|many)/i,/buy (2|two|3|three) items/i,/order (multiple|several)/i,/bulk (buy|purchase|order)/i,/can i buy (more than one|multiple)/i],
    handler:()=>`**🛒 Buying Multiple Items:**\n\nYes! You can buy multiple items in one checkout:\n\n1️⃣ Browse the Buy page\n2️⃣ **Add to Cart** for each item you want\n3️⃣ Open cart → all items appear with total\n4️⃣ **Proceed to Checkout** pays for everything at once\n\n💡 After checkout, each seller gets notified separately — arrange individual meetups per seller.\n\n⚠️ If items are from **different sellers**, you'll need separate meetups for each.`
  },

  // ── SOLD ITEM ────────────────────────────────────────────
  { name:'sold_item',
    keywords:[/my item (was |is )?sold/i,/someone bought/i,/item got sold/i,/how (do|will) i know (if |when )?my item (is |was |got )?sold/i,/when (my |an )?item (is |gets )?sold/i,/notify (me )?when/i],
    handler:()=>`**💰 When Your Item Gets Sold:**\n\n🔔 You'll get an **instant notification** (bell icon) when someone purchases your item.\n\n📧 The buyer's email is available in your **My Orders** tab — wait for their message or reach out first to arrange pickup.\n\n🏷️ Your listing automatically changes to **SOLD** and disappears from the marketplace.\n\n**After the sale:**\n1️⃣ Arrange a campus meetup with the buyer\n2️⃣ Hand over the item\n3️⃣ Confirm payment (cash/UPI on the spot)\n4️⃣ Done! ✅`
  },

  // ── LISTING TIPS ─────────────────────────────────────────
  { name:'listing_tips',
    keywords:[/tip(s)? (for |on )?listing/i,/how (to |do i )?write (a |good |better )?listing/i,/good listing/i,/sell faster/i,/listing (advice|suggestions|tricks)/i,/how (to |do i )?price (my |an )?item/i,/what (price|amount) should i (ask|set|charge)/i],
    handler:()=>`**⚡ Listing Tips for Faster Sales:**\n\n📸 **Photo** — Clear, well-lit. Shows actual condition.\n📝 **Title** — Be specific: "MTech Sem 3 DSA Notes" > "Notes"\n📄 **Description** — Mention: edition, condition, why you're selling\n💰 **Price** — Check what similar items sell for. Price 10–20% below for quick sale.\n🔄 **Enable Trade** — More offers = faster disposal\n🤝 **Accept Price Offers** — Negotiating beats it sitting unsold\n📂 **Category** — Choose carefully, wrong category = less visibility\n\n🏆 **Best performing listings have:** good photo + specific title + honest condition description`
  },

  // ── WHAT HAPPENS AFTER TRADE ─────────────────────────────
  { name:'after_trade',
    keywords:[/after (a |the )?trade/i,/trade (is |was )?accepted/i,/what happens when.*trade/i,/trade (complete|done|finished)/i,/accepted (a )?trade/i,/trade (order|history)/i],
    handler:()=>`**✅ After a Trade is Accepted:**\n\n1️⃣ Both items get marked **TRADED** on the platform\n2️⃣ The trade appears in **My Orders** tab (with ₹0 value)\n3️⃣ The offerer gets a **notification** that their offer was accepted\n4️⃣ Both parties arrange a campus meetup to exchange items\n\n📧 Use **"Contact Seller"** from My Orders to coordinate the swap.\n\n💡 Take photos of both items before the swap — just in case!`
  },

  // ── EMAIL NOT WORKING ─────────────────────────────────────
  { name:'email_issue',
    keywords:[/email (not working|wrong|incorrect|changed)/i,/can.t (sign in|login|access)/i,/forgot (my )?email/i,/wrong email/i,/can i change (my )?email/i,/update (my )?email/i],
    handler:()=>`**📧 Email Issues:**\n\n**Can't log in?**\n→ Use **"Forgot Password"** on the sign-in screen\n→ Check your spam folder for the reset email\n\n**Wrong email registered?**\n→ Firebase doesn't allow email changes directly\n→ Contact support: **swastiksinha001@gmail.com**\n\n**Didn't get verification email?**\n→ Click "Resend Email" on the verification screen\n→ Check spam/junk folder\n→ Wait 2 minutes, then click the link\n\n⚠️ ViTMART accounts require **email verification** before you can buy or sell.`
  },

  // ── HOW MANY LISTINGS ────────────────────────────────────
  { name:'listing_limit',
    keywords:[/how many (listings|items) can i (post|list|sell|have)/i,/listing limit/i,/maximum (listings|items)/i,/limit (on |for )?(listings|items)/i],
    handler:()=>`**📋 Listing Limits:**\n\nThere is **no hard limit** on how many items you can list on ViTMART!\n\nYou can list as many items as you want.\n\n💡 **Best practice:**\n— Remove sold/traded items promptly (or they auto-mark when purchased)\n— Keep descriptions fresh and accurate\n— Use **Manage** → bulk-delete old sold listings to keep your store clean\n\nGo to **Sell** → List My Item to post a new listing! ⚡`
  },

  // ── TRADE vs BUY ─────────────────────────────────────────
  { name:'trade_vs_buy',
    keywords:[/difference between (buy|trade|barter)/i,/(buy|trade|barter) vs/i,/should i (buy|trade)/i,/trade or buy/i,/what.s the difference.*trade.*buy/i],
    handler:()=>`**Buy vs Trade — What's the difference?**\n\n💰 **Buy**\n— Pay cash (simulated on platform, real payment in person)\n— Straightforward: you pay, seller gives item\n— Any available item can be bought\n\n🔄 **Trade / Barter**\n— Exchange items, no money needed\n— Both parties agree to swap what they have\n— Only items with 🔄 badge accept trade offers\n— Seller sees your offer + what you're offering in return\n\n💡 **Which to use?**\n— Have cash → Buy\n— Have something to swap & no cash → Trade\n— Want to negotiate on price → Make a Price Offer`
  },

  // ── ITEM CONDITION ───────────────────────────────────────
  { name:'item_condition',
    keywords:[/item condition/i,/what condition/i,/(is|are) (the )?item(s)? (new|used|second.?hand)/i,/second.?hand/i,/pre.?owned/i,/used items/i,/refurbished/i,/quality (of |check)/i],
    handler:()=>`**📦 Item Conditions on ViTMART:**\n\nViTMART is a **second-hand / used items** marketplace — everything is pre-owned by fellow students.\n\nSellers describe conditions in their listings:\n✨ **Like New** — barely used, looks new\n✅ **Good** — minor signs of use, fully functional\n⚠️ **Fair** — visible wear but works fine\n🔧 **For Parts** — may need repair\n\n💡 **Tip:** Always:\n— Read the description carefully\n— Look at all photos\n— Ask the seller before meeting\n— Test electronics at the meetup before paying`
  },

  // ── FORGOT PASSWORD ──────────────────────────────────────
  { name:'forgot_password',
    keywords:[/forgot password/i,/reset password/i,/can.t (remember|recall) (my )?password/i,/password reset/i,/lost (my )?password/i,/how (to|do i) reset/i],
    handler:()=>`**🔑 Reset Your Password:**\n\n1️⃣ On the **Sign In** screen, click **"Forgot Password?"**\n2️⃣ Enter your registered email\n3️⃣ Check your inbox (and spam!) for the reset email\n4️⃣ Click the link in the email\n5️⃣ Set a new password (min 6 characters)\n\n✅ You can also change your password from **Profile** → Security section if you're already logged in.\n\n⚠️ The reset link expires in 1 hour. Request a new one if needed.`
  },

  // ── WHO BUILT THIS ────────────────────────────────────────
  { name:'who_built',
    keywords:[/who (built|made|created|developed) (this|vitmart)/i,/who (is|are) (the |vitmart.s )?developer/i,/about (the )?developer/i,/creator/i,/admin of vitmart/i],
    handler:()=>`**👨‍💻 About ViTMART:**\n\nViTMART was built by a VIT student for VIT students. 🎓\n\n**Admin & Developer:** Swastik Sinha\n**Contact:** swastiksinha001@gmail.com\n**Instagram:** @ig_swastik\n\nBuilt with Firebase, Tailwind CSS, Cloudinary, and a lot of caffeine ☕\n\nHave feedback or feature requests? Email the admin — all ideas are welcome! 🚀`
  },

  // ── GENERAL HELP ─────────────────────────────────────────
  { name:'help',
    keywords:[/^help$/i,/what can you (do|help with)/i,/commands/i,/features/i,/what do you know/i,/what questions/i,/capabilities/i,/full list/i],
    handler:()=>`I'm **ViT Assistant** ⚡ I know **46 topics** about ViTMART!\n\n**Tap a chip below** or type anything:\n\n🗺️ Navigate · 🔍 Search · 📖 How-to guides\n🤝 Price offers · 🔄 Trade vs Buy · 🛒 Cart\n📌 Noticeboard · 🔔 Notifications · ✨ Recs\n📦 Orders · 💰 Listing tips · 🏫 Meetup spots\n🌙 Dark mode · 🔑 Password reset · 👨‍💻 About us\n\nJust ask naturally — I understand plain English!`
  },

  // ── THANKS ───────────────────────────────────────────────
  { name:'thanks',
    keywords:[/^thanks?$/i,/^thank you$/i,/^thx$/i,/^ty$/i,/thank(s| you)/i,/appreciate/i,/that.s helpful/i,/helpful/i,/great/i,/perfect/i,/awesome/i],
    handler:()=>`You're welcome! 😊\n\n**Happy trading on ViTMART!** ⚡\n\nType **help** anytime if you need anything else.`
  },

  // ── BYE ──────────────────────────────────────────────────
  { name:'bye',
    keywords:[/^bye$/i,/^goodbye$/i,/^cya$/i,/see you/i,/ok thanks/i,/okay thanks/i,/got it/i,/all good/i,/done$/i,/that.s all/i],
    handler:()=>`See you around! ⚡\n\nCome back anytime — **happy trading!** 🎓`
  },
];

// Helper to close chat panel after navigation
const closeChatUI = () => {
  setTimeout(() => {
    document.getElementById('popup-chat-container')?.classList.remove('open');
    document.getElementById('open-popup-chat-btn')?.classList.remove('hidden');
  }, 700);
};

// --- Helpers ---
const getInitials = (name) => {
  if (!name) return '?';
  const p = name.split(' ');
  return p.length > 1 ? p[0][0] + p[p.length-1][0] : name[0];
};

const showMessage = (msg, type = 'success') => {
  const isSuccess = type === 'success';
  const el = document.createElement('div');
  el.className = `px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-500 transform translate-x-full
    ${isSuccess
      ? 'bg-white/90 dark:bg-gray-800/90 border-vit-500/30 text-vit-700 dark:text-vit-300'
      : 'bg-white/90 dark:bg-gray-800/90 border-rose-500/30 text-rose-600 dark:text-rose-400'}
    backdrop-blur-lg`;
  const icon = isSuccess ? '✓' : '✕';
  el.innerHTML = `<span class="mr-2 ${isSuccess ? 'text-vit-500' : 'text-rose-500'}">${icon}</span>${msg}`;
  messageContainer.appendChild(el);
  requestAnimationFrame(() => el.classList.remove('translate-x-full'));
  setTimeout(() => { el.classList.add('translate-x-full'); el.addEventListener('transitionend', () => el.remove()); }, 5000);
};
