import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { generateProductName, generateProductDescription, generateProductPrice } from '../lib/gemini';

interface ProductFormProps {
  productToEdit: Product | null;
  onSave: (productData: Omit<Product, 'id'> | Product) => void;
  onCancel: () => void;
}

const AiButton: React.FC<{ isGenerating: boolean; onClick: () => void; disabled?: boolean; 'aria-label': string;}> = ({ isGenerating, onClick, disabled, ...props }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isGenerating}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
      {...props}
    >
      {isGenerating ? (
        <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <SparklesIcon className="h-5 w-5" />
      )}
    </button>
  );

const ProductForm: React.FC<ProductFormProps> = ({ productToEdit, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingPrice, setIsGeneratingPrice] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setPrice(productToEdit.price.toString());
      setDescription(productToEdit.description);
      setImage(productToEdit.image);
      setImagePreview(productToEdit.image);
    }
  }, [productToEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateName = async () => {
    if (!image) {
      alert('請先上傳圖片才能生成名稱。');
      return;
    }
    setIsGeneratingName(true);
    try {
      const generatedName = await generateProductName(image);
      setName(generatedName);
    } catch (error) {
      console.error('Error generating product name:', error);
      alert('生成商品名稱失敗，請檢查 API Key 或稍後再試。');
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!image) {
      alert('請先上傳圖片才能生成描述。');
      return;
    }
    if (!name) {
      alert('請先提供商品名稱或使用 AI 生成名稱。');
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const generatedDescription = await generateProductDescription(image, name);
      setDescription(generatedDescription);
    } catch (error) {
      console.error('Error generating product description:', error);
      alert('生成商品描述失敗，請檢查 API Key 或稍後再試。');
    } finally {
      setIsGeneratingDescription(false);
    }
  };
  
  const handleGeneratePrice = async () => {
    if (!name || !description) {
      alert('請先提供商品名稱與描述才能建議價格。');
      return;
    }
    setIsGeneratingPrice(true);
    try {
      const generatedPrice = await generateProductPrice(name, description);
      setPrice(generatedPrice.toString());
    } catch (error) {
      console.error('Error generating product price:', error);
      alert('建議商品價格失敗，請檢查 API Key 或稍後再試。');
    } finally {
      setIsGeneratingPrice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !description || !image) {
      alert('請填寫所有欄位並上傳圖片。');
      return;
    }
    
    const productData = {
      name,
      price: parseFloat(price),
      description,
      image,
    };

    if (productToEdit) {
      onSave({ ...productData, id: productToEdit.id });
    } else {
      onSave(productData);
    }
  };
  
  const isGenerating = isGeneratingName || isGeneratingDescription || isGeneratingPrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              {productToEdit ? '編輯商品' : '新增商品'}
            </h2>
            
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-slate-700">商品圖片</label>
                <div className="mt-1 flex items-center">
                  {imagePreview && <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-md object-cover mr-4" />}
                  <div className="flex flex-col">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>{image ? '更換圖片' : '上傳圖片'}</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                     {!image && <p className="text-xs text-red-500 mt-1">請上傳圖片</p>}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">商品名稱</label>
                <div className="relative mt-1">
                  <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10" required />
                  <AiButton isGenerating={isGeneratingName} onClick={handleGenerateName} disabled={!image} aria-label="使用 AI 生成商品名稱" />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">描述</label>
                <div className="relative mt-1">
                  <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10" required />
                  <AiButton isGenerating={isGeneratingDescription} onClick={handleGenerateDescription} disabled={!image || !name} aria-label="使用 AI 生成商品描述" />
                </div>
              </div>

               <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700">價格 (NT$)</label>
                <div className="relative mt-1">
                  <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10" required />
                  <AiButton isGenerating={isGeneratingPrice} onClick={handleGeneratePrice} disabled={!name || !description} aria-label="使用 AI 建議價格" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-3 flex justify-end space-x-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled={isGenerating}>
              取消
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed" disabled={isGenerating}>
              {isGenerating ? 'AI 生成中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
