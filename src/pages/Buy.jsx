import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts } from '../contexts/ProductsContext';
import ProductCard from '../components/ProductCard';
import ProductDetail from './ProductDetail';
import Recommendations from '../components/Recommendations';

export default function Buy() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const isTradeTab = searchParams.get('tab') === 'trade';
  const { products, loading } = useProducts();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sort, setSort] = useState('newest');
  
  const ITEMS_PER_PAGE = 12;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Exclude sold, traded, or removed items from the marketplace view
    list = list.filter(p => p.status === 'available' || p.status === 'pending');
    
    if (isTradeTab) {
      list = list.filter(p => p.isTradeable);
    }
    
    if (search) {
      list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (category !== 'all') {
      list = list.filter(p => p.category === category);
    }
    
    if (priceRange !== 'all') {
      const [mn, mx] = priceRange.split('-').map(Number);
      list = list.filter(p => p.price >= mn && p.price <= mx);
    }
    
    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    }
    
    return list;
  }, [products, search, category, priceRange, sort, isTradeTab]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleReset = () => {
    setSearch('');
    setCategory('all');
    setPriceRange('all');
    setSort('newest');
    setVisibleCount(ITEMS_PER_PAGE);
  };

  if (productId) {
    return <ProductDetail />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">{isTradeTab ? 'Barter' : 'Marketplace'}</p>
          <h2 className="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">{isTradeTab ? 'Items for Trade' : 'Available Items'}</h2>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="glass p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-3 items-center flex-wrap">
        <div className="relative flex-grow w-full md:w-auto">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="search" 
            placeholder="Search items..." 
            className="vit-input pl-9 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
          />
        </div>
        <select 
          className="vit-input flex-1 text-sm w-full md:w-auto"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
        >
          <option value="all">All Categories</option>
          <option value="Books">Books</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Clothing">Clothing</option>
          <option value="Stationery">Stationery</option>
          <option value="Sports Gear">Sports Gear</option>
          <option value="Services">Services</option>
          <option value="Tickets">Event Tickets</option>
          <option value="Other">Other</option>
        </select>
        <select 
          className="vit-input flex-1 text-sm w-full md:w-auto"
          value={priceRange}
          onChange={(e) => { setPriceRange(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
        >
          <option value="all">All Prices</option>
          <option value="0-500">Under ₹500</option>
          <option value="500-2000">₹500–₹2000</option>
          <option value="2000-5000">₹2000–₹5000</option>
          <option value="5000-9999999">Over ₹5000</option>
        </select>
        <select 
          className="vit-input flex-1 text-sm w-full md:w-auto"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low→High</option>
          <option value="price-desc">Price: High→Low</option>
        </select>
        <button onClick={handleReset} className="px-4 py-2.5 glass rounded-xl text-sm font-semibold hover:-translate-y-0.5 transition-transform w-full md:w-auto">
          Reset
        </button>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <p className="text-gray-400 col-span-full py-12 text-center">Loading marketplace...</p>
        ) : displayedProducts.length > 0 ? (
          displayedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="text-gray-400 text-center py-12 col-span-full">No products match your search. 🤷</p>
        )}
      </div>

      {hasMore && (
        <button 
          onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
          className="w-full py-3.5 mt-8 glass rounded-2xl font-bold text-vit-600 dark:text-vit-400 border border-vit-500/20 hover:border-vit-500/40 hover:-translate-y-0.5 transition-all duration-200 text-sm"
        >
          Load More <span className="opacity-60">({filteredProducts.length - visibleCount} more)</span>
        </button>
      )}

      <Recommendations title="Recommended For You" />
    </div>
  );
}
