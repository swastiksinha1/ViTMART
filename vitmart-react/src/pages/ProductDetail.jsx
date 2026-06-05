import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../contexts/ProductsContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import NegotiationModal from '../components/NegotiationModal';
import TradeOfferModal from '../components/TradeOfferModal';
import { recLog } from '../components/Recommendations';

export default function ProductDetail() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const { products, loading } = useProducts();
  const { currentUser, setShowAuthModal } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  if (loading) {
    return <div className="text-center py-24 text-gray-400">Loading product details...</div>;
  }

  const product = products.find(p => p.id === id);

  React.useEffect(() => {
    if (product) recLog(product, 'view');
  }, [product]);

  if (!product) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product not found</h2>
        <button onClick={() => navigate('/buy')} className="mt-4 text-vit-500 hover:underline">Back to Marketplace</button>
      </div>
    );
  }

  const isMyProduct = currentUser?.uid === product.sellerId;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back
      </button>

      <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-vit-500/10">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-6 bg-gray-50 dark:bg-white/5 relative flex items-center justify-center cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-lightbox', { detail: product.imageUrl }))}>
            {product.status === 'sold' && <span className="badge-sold">SOLD</span>}
            {product.status === 'traded' && <span className="badge-traded">TRADED</span>}
            {product.isTradeable && <div className="badge-tradeable">🔄 Tradeable</div>}
            
            <img 
              src={product.imageUrl || 'https://placehold.co/800x600/e8e0ff/7c3aed?text=No+Image'} 
              alt={product.name} 
              className={`w-full max-h-[480px] object-contain rounded-xl ${product.status !== 'available' ? 'grayscale opacity-60' : ''}`} 
            />
          </div>
          
          <div className="p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-3 py-1 bg-vit-100 dark:bg-vit-900/40 text-vit-700 dark:text-vit-300 rounded-full">{product.category || 'Other'}</span>
              {product.isTradeable && <span className="text-xs font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">🔄 Tradeable</span>}
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-black font-syne text-gray-900 dark:text-white mt-2 leading-tight">{product.name}</h1>
            
            <div className="mt-5 py-4 border-y border-gray-100 dark:border-white/10 flex items-center gap-3">
              <img 
                src={product.sellerPhotoURL || `https://placehold.co/44x44/e8e0ff/7c3aed?text=${product.sellerName?.charAt(0) || 'U'}`} 
                className="w-11 h-11 rounded-xl object-cover" 
                alt={product.sellerName} 
              />
              <div>
                <p className="text-xs text-gray-400">Listed by</p>
                <p className="font-bold text-gray-900 dark:text-white">{product.sellerName}</p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mt-5 flex-grow leading-relaxed">{product.description}</p>
            
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Price</p>
              <p className="text-5xl font-black font-syne grad-text-vp mb-5">₹{product.price?.toFixed(0)}</p>
              
              {product.status !== 'available' ? (
                <button className="w-full py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold cursor-not-allowed opacity-75" disabled>
                  {product.status === 'sold' ? 'Item Sold' : product.status === 'traded' ? 'Item Traded' : 'Listing Closed'}
                </button>
              ) : !isMyProduct ? (
                <>
                  <button onClick={() => addToCart(product)} className="add-to-cart-btn w-full py-3 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-vit-500/30 mb-3">Add to Cart</button>
                  <button onClick={() => {
                    if(!currentUser) setShowAuthModal(true);
                    else window.dispatchEvent(new CustomEvent('init-chat', { detail: { product } }));
                  }} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-cyan-500/30 mb-3">💬 Chat with Seller</button>
                  {product.isTradeable && (
                    <button onClick={() => {
                      if(!currentUser) setShowAuthModal(true);
                      else setIsTradeOpen(true);
                    }} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-emerald-500/30 mb-3">Make Trade Offer 🔄</button>
                  )}
                  <button onClick={() => {
                    if(!currentUser) setShowAuthModal(true);
                    else setIsNegotiationOpen(true);
                  }} className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shimmer-btn shadow-xl shadow-amber-500/30 mb-3">🤝 Make a Price Offer</button>
                </>
              ) : (
                <button className="w-full py-3 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold">Manage Your Listing</button>
              )}
            </div>
          </div>
        </div>
      </div>
      <NegotiationModal product={product} isOpen={isNegotiationOpen} onClose={() => setIsNegotiationOpen(false)} />
      <TradeOfferModal product={product} isOpen={isTradeOpen} onClose={() => setIsTradeOpen(false)} />
    </div>
  );
}
