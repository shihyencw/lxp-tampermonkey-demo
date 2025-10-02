import { useState, useCallback, useEffect } from 'react';
import { Product } from '../types';

// Start with an empty list of products, allowing users to add their own.
const initialProducts: Product[] = [];

/**
 * Custom hook to manage product state.
 * - Handles loading initial products from localStorage.
 * - Persists product changes back to localStorage.
 * - Provides functions to add, update, and delete products.
 * - Manages a loading state for the initial data fetch.
 */
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate fetching initial data.
    // In a real app, this would be an API call.
    // Here we'll check localStorage for persisted data.
    const timer = setTimeout(() => {
      try {
        const savedProductsJSON = localStorage.getItem('products');
        if (savedProductsJSON) {
          setProducts(JSON.parse(savedProductsJSON));
        } else {
          setProducts(initialProducts);
        }
      } catch (error) {
        console.error('Could not load products from localStorage', error);
        setProducts(initialProducts);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Persist products to localStorage whenever they change, but not on initial load.
    if (!isLoading) {
      try {
        localStorage.setItem('products', JSON.stringify(products));
      } catch (error) {
        console.error('Could not save products to localStorage', error);
      }
    }
  }, [products, isLoading]);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      // Generate a reasonably unique ID
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
    setProducts((prevProducts) => [newProduct, ...prevProducts]);
  }, []);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prevProducts) => prevProducts.filter((p) => p.id !== id));
  }, []);

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    isLoading,
  };
};
