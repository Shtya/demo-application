import React, { createContext, useContext, useReducer, useCallback } from 'react';

// ─── CART CONTEXT ──────────────────────────────────────────────────────────────

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.id === action.item.id && i.storeId === action.item.storeId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id && i.storeId === action.item.storeId
              ? { ...i, qty: i.qty + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.id === action.id && i.storeId === action.storeId)
        ),
      };
    case 'UPDATE_QTY': {
      if (action.qty <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => !(i.id === action.id && i.storeId === action.storeId)
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id && i.storeId === action.storeId
            ? { ...i, qty: action.qty }
            : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'APPLY_COUPON':
      return { ...state, coupon: action.coupon, discount: action.discount };
    case 'REMOVE_COUPON':
      return { ...state, coupon: null, discount: 0 };
    default:
      return state;
  }
};

const initialState = {
  items: [],
  coupon: null,
  discount: 0,
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((item) => {
    dispatch({ type: 'ADD_ITEM', item });
  }, []);

  const removeItem = useCallback((id, storeId) => {
    dispatch({ type: 'REMOVE_ITEM', id, storeId });
  }, []);

  const updateQty = useCallback((id, storeId, qty) => {
    dispatch({ type: 'UPDATE_QTY', id, storeId, qty });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const applyCoupon = useCallback((coupon, discount) => {
    dispatch({ type: 'APPLY_COUPON', coupon, discount });
  }, []);

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'REMOVE_COUPON' });
  }, []);

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = subtotal >= 200 ? 0 : 25;
  const tax = Math.round(subtotal * 0.14);
  const total = subtotal + deliveryFee + tax - state.discount;

  const value = {
    items: state.items,
    coupon: state.coupon,
    discount: state.discount,
    totalItems,
    subtotal,
    deliveryFee,
    tax,
    total,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
