import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './CartContext';

function readCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (!Array.isArray(storedCart)) return [];
    return storedCart.filter((item) =>
      item &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      Number.isFinite(item.price) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    );
  } catch {
    localStorage.removeItem('cartItems');
    return [];
  }
}

const MAX_CART_QUANTITY = 99;

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product) => {
    const productId = String(product.id || product._id);
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === productId);
      if (existingItem) {
        const nextQuantity = Math.min(existingItem.quantity + 1, MAX_CART_QUANTITY);
        return currentItems.map((item) =>
          item.id === productId ? { ...item, quantity: nextQuantity } : item
        );
      }
      return [...currentItems, { ...product, id: productId, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId, delta) => {
    setCartItems((currentItems) => currentItems.flatMap((item) => {
      if (item.id !== String(productId)) {
        return [item];
      }
      const nextQuantity = item.quantity + delta;
      if (nextQuantity <= 0) {
        return [];
      }
      return [{ ...item, quantity: Math.min(nextQuantity, MAX_CART_QUANTITY) }];
    }));
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== String(productId)));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const value = useMemo(() => ({
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    totalItems
  }), [cartItems, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, totalItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
