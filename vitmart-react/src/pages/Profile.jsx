import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';
import { auth, db } from '../config/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import ProductCard from '../components/ProductCard';

export default function Profile() {
  const { currentUser } = useAuth();
  const { products, loading } = useProducts();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');
  const [name, setName] = useState(currentUser?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  if (!currentUser) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Please log in to view your profile.</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-vit-600 hover:underline">Go Home</button>
      </div>
    );
  }

  const myListings = products.filter(p => p.sellerId === currentUser.uid);

  useEffect(() => {
    if (activeTab === 'orders' && currentUser) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
          const snap = await getDocs(q);
          const userOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Note: Firestore requires an index for orderBy combined with where, so we sort client-side
          userOrders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          setOrders(userOrders);
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (name.trim().length === 0) return;
    setIsSaving(true);
    setMessage('');
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      await updateDoc(doc(db, 'users', currentUser.uid), { displayName: name.trim() });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const profileIcon = currentUser.photoURL ? (
    <img src={currentUser.photoURL} className="h-24 w-24 rounded-2xl object-cover ring-4 ring-vit-500/30 pfp-pop" alt="Profile" />
  ) : (
    <div className="h-24 w-24 bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center font-black text-white text-3xl ring-4 ring-vit-500/30 pfp-pop">
      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
      <div className="mb-8">
        <p className="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">Dashboard</p>
        <h2 className="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">My Account</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 snap-x-scroll no-scrollbar">
        <button 
          onClick={() => setActiveTab('account')} 
          className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'account' ? 'bg-vit-600 text-white shadow-lg shadow-vit-500/30' : 'glass text-gray-600 dark:text-gray-300'}`}
        >
          Profile Details
        </button>
        <button 
          onClick={() => setActiveTab('listings')} 
          className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'listings' ? 'bg-vit-600 text-white shadow-lg shadow-vit-500/30' : 'glass text-gray-600 dark:text-gray-300'}`}
        >
          My Listings ({myListings.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')} 
          className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'orders' ? 'bg-vit-600 text-white shadow-lg shadow-vit-500/30' : 'glass text-gray-600 dark:text-gray-300'}`}
        >
          My Orders
        </button>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-5 animate-tab-content">
          <div className="glass p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">{profileIcon}</div>
            <div className="text-center sm:text-left flex-grow">
              <h3 className="text-2xl font-black font-syne text-gray-900 dark:text-white">{currentUser.displayName}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{currentUser.email}</p>
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl">
            <h3 className="font-black font-syne text-gray-900 dark:text-white mb-4">Account Details</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {message && <div className="text-sm font-bold text-emerald-600 bg-emerald-100 p-3 rounded-lg">{message}</div>}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label>
                <input type="text" className="vit-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email</label>
                <input type="email" className="vit-input opacity-60 cursor-not-allowed" value={currentUser.email} disabled />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="glass p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-black font-syne text-gray-900 dark:text-white">Sign Out</h3>
              <p className="text-sm text-gray-400 mt-1">Sign out of your account</p>
            </div>
            <button onClick={handleLogout} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div className="animate-tab-content">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black font-syne text-gray-900 dark:text-white">Your Marketplace Items</h3>
            <button onClick={() => navigate('/sell')} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all">
              + New Listing
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <p className="text-gray-400 col-span-full">Loading your listings...</p>
            ) : myListings.length > 0 ? (
              myListings.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white/40 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't listed anything yet.</p>
                <button onClick={() => navigate('/sell')} className="text-vit-600 dark:text-vit-400 font-bold hover:underline">Start selling today →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="animate-tab-content space-y-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black font-syne text-gray-900 dark:text-white">Order History</h3>
            {orders.length > 0 && (
              <button onClick={() => {
                if(window.confirm('Clear your entire order history? This cannot be undone.')) {
                  orders.forEach(o => deleteDoc(doc(db, 'orders', o.id)));
                  setOrders([]);
                }
              }} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 hover:-translate-y-0.5 transition-all">
                🗑️ Clear
              </button>
            )}
          </div>

          {loadingOrders ? (
            <p className="text-gray-400 text-center py-10">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="glass p-12 rounded-2xl text-center">
              <div className="text-6xl mb-4">🛍️</div>
              <p className="text-gray-400 font-medium">No orders yet — time to shop!</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="glass p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-100 dark:border-white/10 pb-4 mb-4 gap-2">
                  <div>
                    <p className="font-bold">Order Placed</p>
                    <p className="text-sm text-gray-400">
                      {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg grad-text-vp">₹{order.total?.toFixed(0)}</p>
                    <p className="text-xs text-gray-400 font-mono">ID: {order.id.slice(0,12)}...</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/buy?id=${item.productId}`)}>
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <img src={item.imageUrl} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" alt={item.name} />
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 font-medium">₹{item.price?.toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
