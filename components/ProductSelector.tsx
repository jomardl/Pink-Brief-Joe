import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Package, Loader2, ArrowRight, User } from 'lucide-react';
import { productService } from '../lib/services/productService';
import { isSupabaseConfigured } from '../lib/supabase/client';
import type { Product } from '../lib/supabase/types';
import AddProductModal from './AddProductModal';

interface Props {
  onSelect: (product: { id: string | null; name: string; isOther: boolean }) => void;
  onContinue: () => void;
  initialValue?: { id: string | null; name: string; isOther: boolean };
  userName?: string;
  onUserNameChange?: (name: string) => void;
}

const ProductSelector: React.FC<Props> = ({ onSelect, onContinue, initialValue, userName = '', onUserNameChange }) => {
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(initialValue?.id || null);
  const [isOther, setIsOther] = useState(initialValue?.isOther || false);
  const [otherName, setOtherName] = useState(initialValue?.isOther ? initialValue.name : '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isConfigured] = useState(isSupabaseConfigured());
  const [localUserName, setLocalUserName] = useState(userName);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const grouped = await productService.getGroupedByBrand();
      setProducts(grouped);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = (value: string) => {
    if (value === '__other__') {
      setIsOther(true);
      setSelectedId(null);
      onSelect({ id: null, name: otherName, isOther: true });
    } else {
      setIsOther(false);
      setSelectedId(value);
      // Find product name
      for (const brand in products) {
        const product = products[brand].find(p => p.id === value);
        if (product) {
          onSelect({ id: value, name: product.name, isOther: false });
          break;
        }
      }
    }
  };

  const handleOtherNameChange = (name: string) => {
    setOtherName(name);
    onSelect({ id: null, name, isOther: true });
  };

  const handleProductAdded = (product: { id: string; name: string; brand: string }) => {
    loadProducts();
    setSelectedId(product.id);
    setIsOther(false);
    onSelect({ id: product.id, name: product.name, isOther: false });
  };

  const handleUserNameChange = (name: string) => {
    setLocalUserName(name);
    onUserNameChange?.(name);
  };

  const canContinue = (isOther ? otherName.trim().length >= 2 : selectedId !== null) && localUserName.trim().length >= 2;

  // Show setup message if Supabase not configured
  if (!isConfigured) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
            Step 0
          </p>
          <h2 className="text-3xl font-light text-[#161616] tracking-tight mb-2">
            Select Product
          </h2>
          <p className="text-sm text-[#525252] leading-relaxed">
            Choose an existing product or specify a new one for this brief.
          </p>
        </div>

        <div className="p-6 bg-[#fff8e1] border-l-4 border-[#f9a825] mb-6">
          <p className="text-sm text-[#161616] font-medium mb-2">Database Not Configured</p>
          <p className="text-sm text-[#525252]">
            Supabase credentials are not set. Add <code className="bg-[#f4f4f4] px-1">VITE_SUPABASE_URL</code> and <code className="bg-[#f4f4f4] px-1">VITE_SUPABASE_ANON_KEY</code> to your .env file to enable product management and brief persistence.
          </p>
        </div>

        {/* User Name Input */}
        <div className="p-6 bg-white border border-[#e0e0e0] mb-4">
          <label className="block text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
            Your Name *
          </label>
          <input
            type="text"
            value={localUserName}
            onChange={(e) => handleUserNameChange(e.target.value)}
            placeholder="Enter your name..."
            className="w-full h-12 px-4 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
          />
        </div>

        {/* Allow continuing with "Other" when DB not configured */}
        <div className="p-6 bg-white border border-[#e0e0e0]">
          <label className="block text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={otherName}
            onChange={(e) => handleOtherNameChange(e.target.value)}
            placeholder="Enter product name..."
            className="w-full h-12 px-4 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="h-12 px-6 bg-[#0f62fe] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0353e9] disabled:bg-[#c6c6c6] disabled:cursor-not-allowed transition-colors"
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Step 0
        </p>
        <h2 className="text-3xl font-light text-[#161616] tracking-tight mb-2">
          Select Product
        </h2>
        <p className="text-sm text-[#525252] leading-relaxed">
          Choose an existing product or specify a new one for this brief.
        </p>
      </div>

      {/* User Name Input */}
      <div className="p-6 bg-white border border-[#e0e0e0] mb-4">
        <label className="block text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Your Name *
        </label>
        <input
          type="text"
          value={localUserName}
          onChange={(e) => handleUserNameChange(e.target.value)}
          placeholder="Enter your name..."
          className="w-full h-12 px-4 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
        />
      </div>

      {/* Product Dropdown */}
      <div className="p-6 bg-white border border-[#e0e0e0] mb-4">
        <label className="block text-xs font-mono text-[#6f6f6f] uppercase tracking-wider mb-2">
          Product *
        </label>

        {isLoading ? (
          <div className="h-12 flex items-center justify-center bg-[#f4f4f4]">
            <Loader2 size={20} className="text-[#6f6f6f] animate-spin" />
          </div>
        ) : (
          <div className="relative">
            <select
              value={isOther ? '__other__' : (selectedId || '')}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full h-12 px-4 pr-10 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe] appearance-none cursor-pointer"
            >
              <option value="">Select a product...</option>

              {Object.entries(products).map(([brand, brandProducts]) => (
                <optgroup key={brand} label={brand}>
                  {brandProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.market && ` (${product.market})`}
                    </option>
                  ))}
                </optgroup>
              ))}

              <option value="__other__">Other (specify below)</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f6f6f] pointer-events-none" />
          </div>
        )}

        {/* "Other" text input */}
        <AnimatePresence>
          {isOther && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                value={otherName}
                onChange={(e) => handleOtherNameChange(e.target.value)}
                placeholder="Enter product name..."
                className="w-full h-12 px-4 mt-3 bg-[#f4f4f4] border border-[#e0e0e0] text-sm text-[#161616] focus:outline-none focus:border-[#0f62fe]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add New Product Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 text-sm text-[#0f62fe] font-medium flex items-center gap-2 hover:underline"
        >
          <Plus size={14} />
          Add new product to database
        </button>
      </div>

      {/* Selected Product Preview */}
      <AnimatePresence>
        {(selectedId || (isOther && otherName.trim())) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 bg-[#edf5ff] border-l-4 border-[#0f62fe] mb-6"
          >
            <p className="text-xs font-mono text-[#0f62fe] uppercase tracking-wider mb-1">Selected</p>
            <p className="text-sm font-medium text-[#161616] flex items-center gap-2">
              <Package size={14} />
              {isOther ? otherName : (
                Object.values(products).flat().find(p => p.id === selectedId)?.name || 'Unknown'
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="h-12 px-6 bg-[#0f62fe] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0353e9] disabled:bg-[#c6c6c6] disabled:cursor-not-allowed transition-colors"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
};

export default ProductSelector;
