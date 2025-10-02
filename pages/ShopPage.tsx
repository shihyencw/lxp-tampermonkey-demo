
import React from 'react';
import { useProductContext } from '../contexts/ProductContext';
import ProductCard from '../components/ProductCard';

const ShopPage: React.FC = () => {
  const { products, isLoading } = useProductContext();

  return (
    <div>
      <div className="pb-6 border-b border-slate-200 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">所有商品</h2>
        <p className="mt-2 text-lg text-slate-600">探索我們精選的最新商品。</p>
      </div>

      {isLoading ? (
         <div className="text-center text-slate-500">載入中...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-slate-500 py-12 bg-slate-100 rounded-lg">
          <h3 className="text-xl font-medium">目前沒有商品</h3>
          <p className="mt-2">請至後台管理頁面新增商品。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopPage;
