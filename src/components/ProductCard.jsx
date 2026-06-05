import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const isMyProduct = currentUser?.uid === product.sellerId;

  // Placeholder functions for now
  const handleWishlist = (e) => {
    e.stopPropagation();
    // TODO
  };

  return (
    <div 
      onClick={() => navigate(`/buy?id=${product.id}`)}
      className="product-card tilt-card glass rounded-2xl overflow-hidden flex flex-col cursor-pointer relative"
    >
      <div className="tilt-shine"></div>
      <div className="relative overflow-hidden pointer-events-none">
        {product.status === 'sold' && <div className="badge-sold">SOLD</div>}
        {product.status === 'traded' && <div className="badge-traded">TRADED</div>}
        {product.status === 'removed' && <div className="badge-sold" style={{ background: '#6b7280' }}>CLOSED</div>}
        {product.isTradeable && <div className="badge-tradeable">🔄 Trade</div>}
        
        {!isMyProduct && (
          <button 
            onClick={handleWishlist}
            className="wishlist-btn absolute top-3 right-3 pointer-events-auto z-20"
            title="Save to wishlist"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        <img 
          src={product.imageUrl || 'https://placehold.co/400x300/e8e0ff/7c3aed?text=No+Image'} 
          alt={product.name}
          className={`w-full h-48 object-cover transition-transform duration-500 ${product.status !== 'available' ? 'grayscale opacity-75' : ''}`}
          loading="lazy" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>

      <div className="p-4 flex flex-col flex-grow pointer-events-none">
        <p className="text-xs text-gray-400 mb-1">by {product.sellerName || 'a student'}</p>
        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{product.name}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 flex-grow line-clamp-2 leading-relaxed">{product.description}</p>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xl font-black font-syne grad-text-vp">₹{product.price?.toFixed(0) || 'N/A'}</span>
          <div className="pointer-events-auto">
            {isMyProduct && (product.status === 'available' || product.status === 'pending') ? (
              <span className="px-2.5 py-1 bg-vit-100 dark:bg-vit-900/40 text-vit-700 dark:text-vit-300 text-xs font-bold rounded-full">Your Listing</span>
            ) : product.status === 'available' ? (
              <button 
                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                className="add-to-cart-btn px-4 py-2 bg-gradient-to-r from-vit-600 to-vit-700 text-white text-xs font-bold rounded-xl shimmer-btn shadow-lg shadow-vit-500/30"
              >
                Add to Cart
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
