import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { productService } from '../lib/services/productService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: { id: string; name: string; brand: string }) => void;
}

const CATEGORIES = [
  'Feminine Care',
  'Baby Care',
  'Fabric Care',
  'Home Care',
  'Hair Care',
  'Skin Care',
  'Oral Care',
  'Personal Health',
  'Grooming',
  'Other'
];

const AddProductModal: React.FC<Props> = ({ isOpen, onClose, onProductAdded }) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [market, setMarket] = useState('');
  const [category, setCategory] = useState('');
  const [existingBrands, setExistingBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      productService.getBrands().then(setExistingBrands).catch(console.error);
    }
  }, [isOpen]);

  const handleNameBlur = async () => {
    if (name.length < 2) return;
    const exists = await productService.nameExists(name);
    if (exists) {
      setNameError('Product name already exists');
    } else {
      setNameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalBrand = brand === '__new__' ? newBrand : brand;

    if (!name.trim() || name.length < 2) {
      setError('Product name is required (min 2 characters)');
      return;
    }

    if (!finalBrand.trim()) {
      setError('Brand is required');
      return;
    }

    if (nameError) {
      setError(nameError);
      return;
    }

    setIsLoading(true);

    try {
      const product = await productService.create({
        name: name.trim(),
        brand: finalBrand.trim(),
        market: market.trim() || null,
        category: category || null,
      });

      onProductAdded({
        id: product.id,
        name: product.name,
        brand: product.brand
      });

      // Reset form
      setName('');
      setBrand('');
      setNewBrand('');
      setMarket('');
      setCategory('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#e0e0e0]">
            <h2 className="text-lg font-medium text-[#161616]">Add New Product</h2>
            <button
              onClick={onClose}
              className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#fff1f1] text-[#da1e28] text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="e.g., Always Platinum"
                className={`w-full h-10 px-3 bg-[#f4f4f4] border text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe] ${
                  nameError ? 'border-[#da1e28]' : 'border-[#e0e0e0]'
                }`}
                disabled={isLoading}
              />
              {nameError && (
                <p className="mt-1 text-xs text-[#da1e28]">{nameError}</p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
                Brand *
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-10 px-3 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
                disabled={isLoading}
              >
                <option value="">Select brand...</option>
                {existingBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="__new__">+ Add new brand</option>
              </select>

              {brand === '__new__' && (
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Enter new brand name"
                  className="w-full h-10 px-3 mt-2 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
                  disabled={isLoading}
                />
              )}
            </div>

            {/* Market */}
            <div>
              <label className="block text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
                Market (optional)
              </label>
              <input
                type="text"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="e.g., South Africa, Global"
                className="w-full h-10 px-3 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
                disabled={isLoading}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
                Category (optional)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
                disabled={isLoading}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 text-[#525252] text-sm font-medium hover:bg-[#f4f4f4] transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim() || (!brand && !newBrand.trim())}
                className="h-10 px-4 bg-[#0f62fe] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0353e9] disabled:bg-[#c6c6c6] disabled:cursor-not-allowed transition-colors"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                Add Product
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddProductModal;
