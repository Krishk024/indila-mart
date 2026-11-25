import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ itemCount: 0, subtotal: 0, totalMrp: 0, savings: 0 });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setSummary({ itemCount: 0, subtotal: 0, totalMrp: 0, savings: 0 });
      return;
    }
    setLoading(true);
    try {
      const res = await client.get('/cart');
      setItems(res.data.items);
      setSummary(res.data.summary);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    await client.post('/cart', { product_id: productId, quantity });
    await refreshCart();
  };

  const updateQuantity = async (cartId, quantity) => {
    await client.put(`/cart/${cartId}`, { quantity });
    await refreshCart();
  };

  const removeItem = async (cartId) => {
    await client.delete(`/cart/${cartId}`);
    await refreshCart();
  };

  const clearCart = async () => {
    await client.delete('/cart');
    await refreshCart();
  };

  return (
    <CartContext.Provider value={{ items, summary, loading, addToCart, updateQuantity, removeItem, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
