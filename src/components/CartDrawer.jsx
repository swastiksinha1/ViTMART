import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cartItems, cartTotal, removeFromCart, clearCart } = useCart();
  const { currentUser, setShowAuthModal } = useAuth();
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  if (!isCartOpen && !showSuccess) return null;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setIsCartOpen(false);
      setShowAuthModal(true);
      return;
    }
    
    setIsSimulating(true);
    try {
      // Create an order
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: currentUser.uid,
        items: cartItems.map(i => ({ productId: i.id, name: i.name, price: i.price, imageUrl: i.imageUrl })),
        total: cartTotal,
        status: 'placed',
        createdAt: serverTimestamp()
      });

      // Send notifications to sellers and mark items as sold
      const batch = writeBatch(db);
      const notifiedSellers = new Set();
      cartItems.forEach(item => {
        // Mark product as sold
        batch.update(doc(db, 'products', item.id), { status: 'sold' });

        // Notify seller (allowing self-notification for testing)
        if (item.sellerId && !notifiedSellers.has(item.sellerId)) {
          notifiedSellers.add(item.sellerId);
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            userId: item.sellerId,
            title: '🎉 Item Sold!',
            message: `${currentUser.displayName || 'Someone'} placed an order containing your item "${item.name}".`,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      });
      await batch.commit();

      clearCart();
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setShowSuccess(true);
    } catch(err) {
      console.error("Checkout Error:", err);
      setCheckoutError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-[#120c24] shadow-2xl z-[101] flex flex-col translate-x-0 transition-transform duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold font-syne text-gray-900 dark:text-white">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-lg text-gray-500">
            &times;
          </button>
        </div>
        
        <div className="flex-grow p-6 overflow-y-auto space-y-3">
          {cartItems.length > 0 ? cartItems.map(item => (
            <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
              <img src={item.imageUrl} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" alt={item.name} />
              <div className="flex-grow min-w-0">
                <p className="font-semibold truncate text-sm text-gray-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-gray-500 font-medium">₹{item.price.toFixed(0)}</p>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-full text-center pb-12 opacity-50">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-900 dark:text-white font-medium">Your cart is empty</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 dark:border-white/10">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-gray-900 dark:text-white">Total</span>
            <span className="text-2xl font-black font-syne grad-text-vp">₹{cartTotal.toFixed(0)}</span>
          </div>
          <button 
            onClick={() => {
              if(!currentUser) { setIsCartOpen(false); setShowAuthModal(true); return; }
              setIsCheckoutOpen(true);
            }} 
            disabled={cartItems.length === 0} 
            className="w-full py-3 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-vit-500/30"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[105] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120c24] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-vit-500/30">💳</div>
              <h2 className="text-2xl font-bold font-syne text-gray-900 dark:text-white">Complete Payment</h2>
              <p className="text-gray-500 mt-1">Total: <span className="font-bold grad-text-vp text-lg">₹{cartTotal.toFixed(0)}</span></p>
            </div>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Pay via UPI</label>
                <input type="text" placeholder="yourname@upi" className="vit-input" required />
              </div>
              {checkoutError && (
                <div className="p-3 bg-rose-100 text-rose-700 text-sm font-bold rounded-xl text-center">
                  Error: {checkoutError}
                  <br/><span className="text-xs font-normal">Did you update the Firestore Rules?</span>
                </div>
              )}
              <p className="text-xs text-center text-gray-400 mt-4">⚠️ Simulated payment — no real transaction occurs.</p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsCheckoutOpen(false)} disabled={isSimulating} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-xl font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={isSimulating} className="flex-1 py-2.5 bg-gradient-to-r from-vit-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-vit-500/30">
                  {isSimulating ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[110] backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#120c24] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-subtle-pop border border-emerald-500/30 relative">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-4xl shadow-lg shadow-emerald-500/40 animate-pulse">
              ✓
            </div>
            <h3 className="text-2xl font-bold font-syne text-gray-900 dark:text-white mb-2">Purchase Complete!</h3>
            <p className="text-gray-500 text-sm mb-6">Your order has been placed successfully. You can track it in your profile.</p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </>
  );
}
