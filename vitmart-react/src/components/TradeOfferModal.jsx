import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';

export default function TradeOfferModal({ product, isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { products } = useProducts();
  const [selectedListingId, setSelectedListingId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const myTradeableItems = products.filter(p => p.sellerId === currentUser?.uid && p.status === 'available' && p.isTradeable);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedListingId) return;
    setLoading(true);
    setStatusMsg('');
    try {
      await addDoc(collection(db, 'chats'), {
        buyerId: currentUser.uid,
        buyerName: currentUser.displayName,
        buyerPhoto: currentUser.photoURL || '',
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        sellerPhoto: product.sellerPhotoURL || '',
        productId: product.id,
        productName: product.name,
        type: 'trade_offer',
        offeredProductId: selectedListingId,
        lastMessage: `TRADE OFFER: I want to trade my item for your ${product.name}`,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        unreadSeller: 1
      });

      await addDoc(collection(db, 'notifications'), {
        userId: product.sellerId,
        title: '🔄 New Trade Offer',
        message: `${currentUser.displayName || 'Someone'} wants to trade for your "${product.name}".`,
        read: false,
        createdAt: serverTimestamp()
      });

      setStatusMsg('Trade offer sent successfully!');
      setTimeout(() => {
        setStatusMsg('');
        setLoading(false);
        onClose();
      }, 1500);
    } catch (error) {
      setStatusMsg('Failed to send offer.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#120c24] rounded-3xl p-6 w-full max-w-md shadow-2xl animate-subtle-pop border border-vit-500/20 relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          &times;
        </button>
        <div className="text-center mb-6 mt-2">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-emerald-500/30">🔄</div>
          <h2 className="text-2xl font-bold font-syne text-gray-900 dark:text-white">Propose a Trade</h2>
          <p className="text-gray-500 mt-1 text-sm">Offer one of your tradeable items for <strong>{product.name}</strong>.</p>
        </div>

        {statusMsg && (
          <div className={`p-3 text-sm font-bold rounded-xl text-center mb-4 ${statusMsg.includes('success') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {statusMsg}
          </div>
        )}

        {myTradeableItems.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
            <p className="text-gray-500 text-sm mb-4">You don't have any active items marked as "Tradeable".</p>
            <button onClick={onClose} className="py-2.5 px-6 bg-vit-600 text-white rounded-xl font-bold text-sm">Got it</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Select Item to Offer</label>
              <select 
                value={selectedListingId} 
                onChange={(e) => setSelectedListingId(e.target.value)} 
                className="vit-input w-full"
                required
              >
                <option value="">-- Choose an item --</option>
                {myTradeableItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
              <button type="submit" disabled={loading || !selectedListingId} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Offer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
