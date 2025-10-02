
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-xl flex flex-col">
      <div className="aspect-w-1 aspect-h-1 w-full">
        <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-slate-800">{product.name}</h3>
        <p className="text-sm text-slate-600 mt-1 flex-grow">{product.description}</p>
        <div className="mt-4 text-right">
          <span className="text-xl font-bold text-indigo-600">NT$ {product.price.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
