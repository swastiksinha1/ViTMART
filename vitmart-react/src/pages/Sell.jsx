import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Sell() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Books');
  const [isTradeable, setIsTradeable] = useState(false);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    } else {
      setError('Please select a valid image.');
    }
  };

  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Image upload failed.');
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('You must be logged in to sell items.');
      return;
    }
    if (!imageFile) {
      setError('Product image is required.');
      return;
    }
    if (productName.trim().length < 3) {
      setError('Product name must be at least 3 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const imageUrl = await uploadToCloudinary(imageFile);
      
      await addDoc(collection(db, 'products'), {
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName || 'Anonymous Student',
        sellerPhotoURL: auth.currentUser.photoURL || '',
        name: productName.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        isTradeable,
        imageUrl,
        status: 'available',
        createdAt: serverTimestamp()
      });

      navigate('/profile'); // Redirect to profile/listings after success
    } catch (err) {
      console.error(err);
      setError('Failed to list item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto container px-4">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back
      </button>

      <div className="text-center mb-8">
        <p className="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">New Listing</p>
        <h2 className="text-3xl font-black font-syne text-gray-900 dark:text-white mt-2">List an Item</h2>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 rounded-2xl shadow-xl space-y-5" noValidate>
        {error && <div className="p-4 bg-rose-100 text-rose-700 rounded-xl text-sm font-bold">{error}</div>}
        
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Product Image *</label>
          <div 
            className={`drop-zone flex justify-center items-center w-full h-56 rounded-2xl bg-vit-50/50 dark:bg-vit-900/10 cursor-pointer transition-all ${isDragging ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
          >
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-contain rounded-2xl p-2" alt="Preview" />
            ) : (
              <div className="text-center text-gray-400 pointer-events-none">
                <div className="w-14 h-14 bg-vit-100 dark:bg-vit-900/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">📷</div>
                <p className="text-sm">Drag & drop or <span className="font-bold text-vit-600 dark:text-vit-400">click to upload</span></p>
                <p className="text-xs mt-1 text-gray-300">PNG, JPG, WEBP</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        </div>

        <div>
          <input type="text" placeholder="Product Name *" className="vit-input" required 
                 value={productName} onChange={e => setProductName(e.target.value)} />
        </div>
        
        <div>
          <textarea placeholder="Detailed Description *" className="vit-input resize-none" rows="4" required
                    value={description} onChange={e => setDescription(e.target.value)}></textarea>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input type="number" placeholder="Price (₹) *" className="vit-input" required min="0"
                   value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <select className="vit-input" value={category} onChange={e => setCategory(e.target.value)}>
            <option>Books</option>
            <option>Electronics</option>
            <option>Furniture</option>
            <option>Clothing</option>
            <option>Stationery</option>
            <option>Sports Gear</option>
            <option>Services</option>
            <option value="Tickets">Event Tickets</option>
            <option>Other</option>
          </select>
        </div>
        
        <label className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded text-vit-600 border-gray-300 dark:border-gray-600"
                 checked={isTradeable} onChange={e => setIsTradeable(e.target.checked)} />
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">🔄 Accept Trade/Barter offers for this item</span>
        </label>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-vit-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Uploading...' : '⚡ List My Item'}
        </button>
      </form>
    </div>
  );
}
