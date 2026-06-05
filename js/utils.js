const esc = (str = '') => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// ── Fix 3c: Cloudinary image optimizer — auto compress + resize + WebP ──────
const optimizeImage = (url, width = 400) => {
  if (!url || !url.includes('cloudinary')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto,dpr_auto/`);
};

// ── Fix 3d: Debounce utility ─────────────────────────────────────────────────
const debounce = (fn, delay = 280) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};



// ── Simple body scroll-lock — only called explicitly, no prototype patching ──
const lockBody = () => {
  if (document.body.dataset.locked) return;
  document.body.dataset.locked = '1';
  document.body.dataset.scrollY = String(window.scrollY);
  document.body.style.overflow = 'hidden';
};
const unlockBody = () => {
  if (!document.body.dataset.locked) return;
  delete document.body.dataset.locked;
  document.body.style.overflow = '';
  window.scrollTo(0, parseInt(document.body.dataset.scrollY || '0'));
};

// --- Cloudinary ---
const uploadToCloudinary = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  try {
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Upload failed.');
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    showMessage('Image upload failed. Please try again.', 'error');
    return null;
  }
};

const BAD_WORDS = ['damn', 'hell', 'crap', 'ass', 'bitch', 'fool', 'idiot'];
const filterProfanity = (text) => {
  if (!text) return '';
  const regex = new RegExp(`\\b(${BAD_WORDS.join('|')})\\b`, 'gi');
  return text.replace(regex, match => '*'.repeat(match.length));
};

function setupImageUploadListeners(dropZoneId, fileInputId, previewId, promptId, cb) {
  const dz = document.getElementById(dropZoneId);
  const fi = document.getElementById(fileInputId);
  const pv = document.getElementById(previewId);
  const pr = document.getElementById(promptId);
  if (!dz) return;
  const handle = (file) => {
    if (file?.type.startsWith('image/')) {
      cb(file);
      const r = new FileReader();
      r.onload = e => { pv.src=e.target.result; pv.classList.remove('hidden'); pr.classList.add('hidden'); };
      r.readAsDataURL(file);
    } else showMessage('Please select a valid image.','error');
  };
  dz.onclick = () => fi.click();
  fi.onchange = e => handle(e.target.files[0]);
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag-over'); };
  dz.ondragleave = () => dz.classList.remove('drag-over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag-over'); handle(e.dataTransfer.files[0]); };
}

function setupPfpUploadListeners() {
  const dz = document.getElementById('pfp-drop-zone');
  const fi = document.getElementById('pfp-upload');
  const pv = document.getElementById('pfp-preview');
  const pr = document.getElementById('pfp-upload-prompt');
  const ag = document.getElementById('avatar-grid');
  if (!dz) return;
  const handle = (file) => {
    if (file?.type.startsWith('image/')) {
      uploadedPfpFile = file; selectedAvatarUrl = null;
      const r = new FileReader();
      r.onload = e => { pv.src=e.target.result; pr.classList.add('hidden'); pv.classList.remove('hidden'); ag.querySelectorAll('.avatar-option').forEach(el=>el.style.borderColor='transparent'); };
      r.readAsDataURL(file);
    } else showMessage('Please select a valid image.','error');
  };
  dz.onclick = () => fi.click();
  fi.onchange = e => handle(e.target.files[0]);
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag-over'); };
  dz.ondragleave = () => dz.classList.remove('drag-over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag-over'); handle(e.dataTransfer.files[0]); };
  ag.addEventListener('click', e => {
    const av = e.target.closest('.avatar-option');
    if (av) {
      uploadedPfpFile = null; selectedAvatarUrl = av.dataset.url;
      pr.classList.remove('hidden'); pv.classList.add('hidden');
      ag.querySelectorAll('.avatar-option').forEach(el=>el.style.borderColor='transparent');
      av.style.borderColor = '#7c3aed';
    }
  });
}

// --- App Init ---
