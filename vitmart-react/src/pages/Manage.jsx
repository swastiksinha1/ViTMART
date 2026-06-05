import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

export default function Manage() {
  const { currentUser } = useAuth();
  const { products } = useProducts();
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    if (!currentUser) return;
    const fetchOrders = async () => {
      const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(data);
    };
    fetchOrders();
  }, [currentUser]);

  if (!currentUser) {
    return <div className="text-center py-24 text-gray-400">Sign in to manage your data.</div>;
  }

  const myProducts = products.filter(p => p.sellerId === currentUser.uid);
  const soldProducts = myProducts.filter(p => p.status === 'sold' || p.status === 'traded');
  const activeProducts = myProducts.filter(p => p.status === 'available');

  const handleDeleteSold = async () => {
    if (soldProducts.length === 0) return;
    if (!window.confirm(`Delete ALL ${soldProducts.length} sold/traded listings? This cannot be undone.`)) return;
    
    try {
      const batch = writeBatch(db);
      soldProducts.forEach(p => {
        batch.delete(doc(db, 'products', p.id));
      });
      await batch.commit();
      alert(`Deleted ${soldProducts.length} listing(s).`);
      // Since useProducts is real-time, the UI will automatically update
    } catch(e) {
      alert('Error: ' + e.message);
    }
  };

  const handleClearOrders = async () => {
    if (orders.length === 0) return;
    if (!window.confirm('Clear all order history? This is permanent.')) return;
    
    try {
      const batch = writeBatch(db);
      orders.forEach(o => {
        batch.delete(doc(db, 'orders', o.id));
      });
      await batch.commit();
      setOrders([]);
      alert('Order history cleared.');
    } catch(e) {
      alert('Error: ' + e.message);
    }
  };

  const handleClearLocalData = () => {
    if (!window.confirm('Clear ALL local data (wishlist, history, preferences)? Cannot be undone.')) return;
    const keys = ['vitmart_wishlist', 'vitmart_browse_history', 'vitmart_interests', 'theme', 'vm_rec_events', 'vm_rec_profile'];
    keys.forEach(k => localStorage.removeItem(k));
    alert('All local data cleared.');
    window.location.reload();
  };

  const handleDeleteAllListings = async () => {
    if (myProducts.length === 0) {
      alert('You have no listings to delete.');
      return;
    }
    if (!window.confirm(`Delete ALL ${myProducts.length} of your listings? This cannot be undone!`)) return;
    
    try {
      const batch = writeBatch(db);
      myProducts.forEach(p => {
        batch.delete(doc(db, 'products', p.id));
      });
      await batch.commit();
      alert('All listings deleted.');
    } catch(e) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <p className="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest mb-2">Data Management</p>
        <h2 className="text-4xl font-black font-syne text-gray-900 dark:text-white">Manage & <span className="text-transparent bg-clip-text bg-gradient-to-r from-vit-600 to-cyan-500">Cleanup</span></h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Delete old listings, clear history, and keep your profile tidy</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Old Listings */}
        <div className="glass rounded-2xl p-6 border border-vit-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 text-lg">📦</div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white">Old Listings</h3>
              <p className="text-xs text-gray-400">Sold & traded items you can remove</p>
            </div>
            <span className="ml-auto px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full">{soldProducts.length}</span>
          </div>
          {soldProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">✅ No old listings to clean up</p>
          ) : (
            <button onClick={handleDeleteSold} className="w-full py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 hover:-translate-y-0.5 transition-all shimmer-btn">Delete All Sold/Traded 🗑️</button>
          )}
        </div>

        {/* Order History */}
        <div className="glass rounded-2xl p-6 border border-vit-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 text-lg">🧾</div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white">Order History</h3>
              <p className="text-xs text-gray-400">Your past purchases</p>
            </div>
            <span className="ml-auto px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full">{orders.length}</span>
          </div>
          {orders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">✅ No order history</p>
          ) : (
            <button onClick={handleClearOrders} className="w-full py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 hover:-translate-y-0.5 transition-all shimmer-btn">Clear All Order History 🗑️</button>
          )}
        </div>

        {/* Local Data */}
        <div className="glass rounded-2xl p-6 border border-vit-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-vit-100 dark:bg-vit-900/30 flex items-center justify-center text-vit-500 text-lg">🔍</div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white">Local Data</h3>
              <p className="text-xs text-gray-400">Wishlist & Browse History</p>
            </div>
          </div>
          <button onClick={handleClearLocalData} className="w-full py-2.5 glass rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">Clear Local Data</button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl p-6 border border-rose-500/30 mt-6 bg-rose-500/5 dark:bg-rose-900/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 text-lg">⚠️</div>
          <div>
            <h3 className="font-black text-rose-600 dark:text-rose-400">Danger Zone</h3>
            <p className="text-xs text-gray-400">Irreversible actions — proceed with caution</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleDeleteAllListings} className="px-5 py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-xl text-sm font-bold hover:bg-rose-500 hover:text-white hover:-translate-y-0.5 transition-all">🗑️ Delete All My Listings</button>
        </div>
      </div>
    </div>
  );
}
