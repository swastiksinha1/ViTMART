const renderSellPage = () => {
  const c = document.getElementById('sell-tab');
  uploadedProductFile = null;
  c.innerHTML = `
    <div class="max-w-2xl mx-auto">
      ${getBackButtonHTML()}
      <div class="text-center mb-8">
        <p class="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">New Listing</p>
        <h2 class="text-3xl font-black font-syne text-gray-900 dark:text-white mt-2">List an Item</h2>
      </div>
      <form id="add-product-form" class="glass p-8 rounded-2xl shadow-xl space-y-5" novalidate>
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Product Image *</label>
          <div id="image-drop-zone" class="drop-zone flex justify-center items-center w-full h-56 rounded-2xl bg-vit-50/50 dark:bg-vit-900/10 cursor-pointer transition-all">
            <div id="image-upload-prompt" class="text-center text-gray-400">
              <div class="w-14 h-14 bg-vit-100 dark:bg-vit-900/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">📷</div>
              <p class="text-sm">Drag & drop or <span class="font-bold text-vit-600 dark:text-vit-400">click to upload</span></p>
              <p class="text-xs mt-1 text-gray-300">PNG, JPG, WEBP</p>
              <input type="file" id="imageUrlUpload" class="hidden" accept="image/*">
            </div>
            <img id="image-preview" class="hidden w-full h-full object-contain rounded-2xl p-2">
          </div>
        </div>
        <div><input type="text" id="productName" placeholder="Product Name *" class="vit-input" required></div>
        <div><textarea id="description" placeholder="Detailed Description *" class="vit-input resize-none" rows="4" required></textarea></div>
        <div class="grid grid-cols-2 gap-4">
          <div><input type="number" id="price" placeholder="Price (₹) *" class="vit-input" required min="0"></div>
          <select id="category" class="vit-input">
            <option>Books</option><option>Electronics</option><option>Furniture</option><option>Clothing</option>
            <option>Stationery</option><option>Sports Gear</option><option>Services</option><option value="Tickets">Event Tickets</option><option>Other</option>
          </select>
        </div>
        <label class="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl cursor-pointer">
          <input type="checkbox" id="isTradeable" class="h-4 w-4 rounded text-vit-600 border-gray-300 dark:border-gray-600">
          <span class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">🔄 Accept Trade/Barter offers for this item</span>
        </label>
        <button type="submit" id="list-item-btn" class="w-full py-3.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-vit-500/30 flex items-center justify-center gap-2">
          <span>⚡</span> List My Item
        </button>
      </form>
    </div>`;
  setupImageUploadListeners('image-drop-zone','imageUrlUpload','image-preview','image-upload-prompt', f => uploadedProductFile = f);
  document.getElementById('productName').addEventListener('blur', e => validateInput(e.target, v => v.trim().length > 2, 'Name must be more than 2 characters.'));
  document.getElementById('description').addEventListener('blur', e => validateInput(e.target, v => v.trim().length > 10, 'Description must be more than 10 characters.'));
};

// --- Lost & Found ---
