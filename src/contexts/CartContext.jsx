import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('vitmart_cart') || '{}'));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('vitmart_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[product.id]) {
        newCart[product.id].quantity += 1;
      } else {
        newCart[product.id] = { ...product, quantity: 1 };
      }
      return newCart;
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const clearCart = () => setCart({});

  return (
    <CartContext.Provider value={{ 
      cart, 
      cartItems: Object.values(cart),
      cartCount: Object.values(cart).reduce((s, i) => s + i.quantity, 0),
      cartTotal: Object.values(cart).reduce((s, i) => s + i.price * i.quantity, 0),
      addToCart, 
      removeFromCart, 
      clearCart, 
      isCartOpen, 
      setIsCartOpen, 
      isCheckoutOpen, 
      setIsCheckoutOpen 
    }}>
      {children}
    </CartContext.Provider>
  );
}
