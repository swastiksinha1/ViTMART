import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Buy from './pages/Buy';
import Sell from './pages/Sell';
import Profile from './pages/Profile';
import Noticeboard from './pages/Noticeboard';
import LostAndFound from './pages/LostAndFound';
import Reviews from './pages/Reviews';
import Manage from './pages/Manage';
import NotFound from './pages/NotFound';
import AuthModal from './components/AuthModal';
import ChatWidget from './components/ChatWidget';
import ChatBotWidget from './components/ChatBotWidget';
import GlobalUI from './components/GlobalUI';
import CartDrawer from './components/CartDrawer';

function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <Router>
            <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="buy" element={<Buy />} />
              <Route path="sell" element={<Sell />} />
              <Route path="profile" element={<Profile />} />
              <Route path="noticeboard" element={<Noticeboard />} />
              <Route path="lost-and-found" element={<LostAndFound />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="manage" element={<Manage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <AuthModal />
          <ChatBotWidget />
          <ChatWidget />
          <GlobalUI />
          <CartDrawer />
        </Router>
      </CartProvider>
    </ProductsProvider>
    </AuthProvider>
  );
}

export default App;
