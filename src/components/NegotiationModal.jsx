import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NegotiationModal({ product, isOpen, onClose }) {
  const { currentUser, setShowAuthModal } = useAuth();
  const [offerPrice, setOfferPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onClose();
      setShowAuthModal(true);
      return;
    }

    const price = parseFloat(offerPrice);
    if (!price || price <= 0) {
      alert('Enter a valid offer price');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'products', product.id, 'price_offers'), {
        offerPrice: price,
        message: message.trim(),
        buyerId: currentUser.uid,
        buyerName: currentUser.displayName || 'Buyer',
        buyerPhoto: currentUser.photoURL || null,
        buyerEmail: currentUser.email,
        originalPrice: product.price,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert('Offer sent! The seller will see your offer on their listing.');
      onClose();
      setOfferPrice('');
      setMessage('');
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1a1430] w-full max-w-sm rounded-3xl shadow-2xl p-6 relative">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg">🤝</div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Make an Offer</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Seller's price: <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-vit-600 to-cyan-500 text-lg">₹{product.price?.toFixed(0)}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Your Offer (₹)</label>
            <input 
              type="number" 
              value={offerPrice} 
              onChange={e => setOfferPrice(e.target.value)} 
              className="vit-input text-xl font-black w-full" 
              placeholder="Enter your price" 
              min="1" 
              max={product.price * 2} 
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Message (optional)</label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              className="vit-input resize-none text-sm w-full" 
              rows="2" 
              placeholder="e.g. 'Can you do ₹800? I'll pick up today.'"
            ></textarea>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 glass rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-amber-500/30">
              {isSubmitting ? 'Sending...' : 'Send Offer 🤝'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
