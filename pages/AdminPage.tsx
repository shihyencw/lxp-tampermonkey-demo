import React, { useState } from 'react';
import { useProductContext } from '../contexts/ProductContext';
import { Product } from '../types';
import ProductForm from '../components/ProductForm';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const AdminPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, isLoading } = useProductContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleAddClick = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const handleSave = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
      updateProduct(productData);
    } else {
      addProduct(productData);
    }
    // 儲存後關閉表單並清除編輯狀態
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center pb-6 border-b border-slate-200 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">商品管理</h2>
          <p className="mt-2 text-lg text-slate-600">在此新增、編輯或刪除您的商品。</p>
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          新增商品
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-500">載入中...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul role="list" className="divide-y divide-slate-200">
            {products.map((product) => (
              <li key={product.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img className="h-16 w-16 rounded-md object-cover" src={product.image} alt={product.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-slate-900 truncate">{product.name}</p>
                    <p className="text-sm text-slate-500 truncate">NT$ {product.price}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="Edit"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isFormOpen && (
        <ProductForm
          productToEdit={editingProduct}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {productToDelete && (
        <ConfirmDeleteModal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleConfirmDelete}
          productName={productToDelete.name}
        />
      )}
    </div>
  );
};

export default AdminPage;