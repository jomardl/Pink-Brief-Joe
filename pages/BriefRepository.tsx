import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Loader2, FileText, AlertCircle } from 'lucide-react';
import { briefService } from '../lib/services/briefService';
import { productService } from '../lib/services/productService';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { useBriefFlowStore } from '../lib/stores/briefFlowStore';
import type { BriefWithProduct, Product } from '../lib/supabase/types';
import BriefCard from '../components/BriefCard';
import ConfirmDialog from '../components/ConfirmDialog';
import Header from '../components/Header';

const BriefRepository: React.FC = () => {
  const navigate = useNavigate();
  const reset = useBriefFlowStore((state) => state.reset);
  const [briefs, setBriefs] = useState<BriefWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'complete'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alpha'>('recent');

  // Archive dialog state
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archivingBriefId, setArchivingBriefId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedProduct, selectedStatus]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [briefsResult, productsResult] = await Promise.all([
        briefService.getAll({
          productId: selectedProduct !== 'all' ? selectedProduct : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : 'all',
        }),
        productService.getAll()
      ]);

      setBriefs(briefsResult.briefs);
      setProducts(productsResult);
    } catch (err: any) {
      setError(err.message || 'Failed to load briefs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (id: string, status: string) => {
    // Drafts go directly to BriefFlow for editing
    // Completed briefs go to BriefView for viewing
    if (status === 'draft') {
      navigate(`/new/${id}`);
    } else {
      navigate(`/brief/${id}`);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newBrief = await briefService.duplicate(id);
      navigate(`/brief/${newBrief.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate brief');
    }
  };

  const handleArchive = (id: string) => {
    setArchivingBriefId(id);
    setShowArchiveDialog(true);
  };

  const confirmArchive = async () => {
    if (!archivingBriefId) return;

    try {
      await briefService.archive(archivingBriefId);
      setBriefs(briefs.filter(b => b.id !== archivingBriefId));
    } catch (err: any) {
      setError(err.message || 'Failed to archive brief');
    } finally {
      setShowArchiveDialog(false);
      setArchivingBriefId(null);
    }
  };

  const cancelArchive = () => {
    setShowArchiveDialog(false);
    setArchivingBriefId(null);
  };

  // Sort briefs
  const sortedBriefs = [...briefs].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      case 'alpha':
        return a.title.localeCompare(b.title);
      case 'recent':
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });

  // Show setup message if Supabase not configured
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#f4f4f4]">
        <Header breadcrumbs={[{ label: 'Brief Repository' }]} />

        <main className="max-w-5xl mx-auto p-8">
          <div className="p-6 bg-[#fff8e1] border-l-4 border-[#f9a825]">
            <p className="text-sm text-[#161616] font-medium mb-2">Database Not Configured</p>
            <p className="text-sm text-[#525252]">
              Supabase credentials are not set. Add <code className="bg-[#f4f4f4] px-1">VITE_SUPABASE_URL</code> and <code className="bg-[#f4f4f4] px-1">VITE_SUPABASE_ANON_KEY</code> to your .env file to enable brief persistence and repository features.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <Header breadcrumbs={[{ label: 'Brief Repository' }]} />

      <main className="max-w-5xl mx-auto p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-[#161616] tracking-tight mb-2">
            Brief Repository
          </h1>
          <p className="text-sm text-[#525252]">
            Browse and manage your saved briefs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-white border border-[#e0e0e0]">
          <Filter size={16} className="text-[#6f6f6f]" />

          {/* Product Filter */}
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="h-8 px-3 bg-[#f4f4f4] border border-[#e0e0e0] text-xs text-[#161616] focus:outline-none focus:border-[#0f62fe]"
          >
            <option value="all">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="h-8 px-3 bg-[#f4f4f4] border border-[#e0e0e0] text-xs text-[#161616] focus:outline-none focus:border-[#0f62fe]"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="complete">Complete</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 px-3 bg-[#f4f4f4] border border-[#e0e0e0] text-xs text-[#161616] focus:outline-none focus:border-[#0f62fe] ml-auto"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-[#fff1f1] border-l-4 border-[#da1e28] mb-6">
            <AlertCircle size={16} className="text-[#da1e28]" />
            <p className="text-sm text-[#161616]">{error}</p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={32} className="text-[#0f62fe] animate-spin mb-4" />
            <p className="text-sm text-[#6f6f6f]">Loading briefs...</p>
          </div>
        ) : sortedBriefs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#e0e0e0]">
            <FileText size={48} className="text-[#e0e0e0] mb-4" />
            <p className="text-lg font-light text-[#161616] mb-2">No briefs found</p>
            <p className="text-sm text-[#6f6f6f] mb-6">
              {selectedProduct !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first brief to get started'}
            </p>
            <button
              onClick={() => {
                reset();
                navigate('/new');
              }}
              className="h-10 px-4 bg-[#0f62fe] text-white text-sm font-medium hover:bg-[#0353e9] transition-colors"
            >
              Create New Brief
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedBriefs.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                onOpen={handleOpen}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </main>

      {/* Archive confirmation dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        title="Archive Brief"
        message="Are you sure you want to archive this brief? You can restore it later from the archived items."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmArchive}
        onCancel={cancelArchive}
      />
    </div>
  );
};

export default BriefRepository;
