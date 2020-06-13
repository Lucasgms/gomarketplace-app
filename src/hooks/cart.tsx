import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

async function setCartOnStorage(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(
    '@GoMarketplace:cartItems',
    JSON.stringify(products),
  );
}

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartItems = await AsyncStorage.getItem('@GoMarketplace:cartItems');
      if (cartItems) {
        setProducts(JSON.parse(cartItems));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );
      await setCartOnStorage(products);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      // TODO ADD A NEW ITEM TO THE CART
      const foundedProduct = products.find(
        cartProduct => cartProduct.id === product.id,
      );

      if (foundedProduct) {
        increment(foundedProduct.id);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await setCartOnStorage(products);
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const foundedProduct = products.find(product => product.id === id);

      if (foundedProduct) {
        const newProducts =
          foundedProduct.quantity === 1
            ? products.filter(product => product.id !== id)
            : products.map(product =>
                product.id === id
                  ? { ...product, quantity: product.quantity - 1 }
                  : product,
              );

        setProducts(newProducts);
      }

      await setCartOnStorage(products);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
