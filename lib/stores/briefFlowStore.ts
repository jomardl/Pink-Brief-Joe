import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { briefService } from '../services/briefService';
import { useAIProviderStore } from './aiProviderStore';
import type {
  Brief,
  SourceDocument,
  InsightsData,
  MarketingSummary,
  PinkBriefData,
  ExtractedInsightDB
} from '../supabase/types';

export type FlowStep = 'product' | 'upload' | 'insights' | 'strategy' | 'brief';

interface ProductSelection {
  id: string | null;
  name: string;
  isOther: boolean;
}

interface BriefFlowState {
  // Step tracking
  currentStep: FlowStep;

  // Brief data (persisted to Supabase)
  briefId: string | null;
  product: ProductSelection | null;
  userName: string;

  // Document data
  sourceDocuments: SourceDocument[];
  rawDocumentText: string;

  // Insights step
  categoryContext: string;
  insights: ExtractedInsightDB[];
  selectedInsightId: number | null;

  // Strategy step
  marketingSummary: MarketingSummary | null;

  // Brief step
  pinkBrief: PinkBriefData | null;

  // Loading/saving states
  isSaving: boolean;
  lastSaved: string | null;

  // Actions
  setStep: (step: FlowStep) => void;
  setProduct: (product: ProductSelection) => void;
  setUserName: (name: string) => void;

  // Brief lifecycle
  createBrief: (title?: string) => Promise<string>;
  loadBrief: (id: string) => Promise<void>;
  saveDraft: () => Promise<void>;
  completeBrief: () => Promise<void>;

  // Data setters (auto-save after setting)
  setSourceDocument: (doc: SourceDocument, rawText: string) => void;
  setInsightsData: (categoryContext: string, insights: ExtractedInsightDB[]) => void;
  selectInsight: (insightId: number) => void;
  setMarketingSummary: (summary: MarketingSummary) => void;
  setPinkBrief: (brief: PinkBriefData) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentStep: 'product' as FlowStep,
  briefId: null,
  product: null,
  userName: '',
  sourceDocuments: [],
  rawDocumentText: '',
  categoryContext: '',
  insights: [],
  selectedInsightId: null,
  marketingSummary: null,
  pinkBrief: null,
  isSaving: false,
  lastSaved: null,
};

export const useBriefFlowStore = create<BriefFlowState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setProduct: (product) => set({ product }),

      setUserName: (name) => set({ userName: name }),

      createBrief: async (title?: string) => {
        const { product, userName } = get();
        if (!product) throw new Error('Product not selected');

        set({ isSaving: true });

        const dateStr = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        const defaultTitle = userName
          ? `${product.name} - ${dateStr} - ${userName}`
          : `${product.name} - ${dateStr}`;

        try {
          const brief = await briefService.create({
            product_id: product.isOther ? null : product.id,
            product_name_override: product.isOther ? product.name : null,
            title: title || defaultTitle,
            created_by: userName || null,
          });

          set({
            briefId: brief.id,
            isSaving: false,
            lastSaved: new Date().toISOString(),
            currentStep: 'upload'
          });

          return brief.id;
        } catch (error) {
          set({ isSaving: false });
          throw error;
        }
      },

      loadBrief: async (id: string) => {
        set({ isSaving: true });

        try {
          const brief = await briefService.getById(id);

          // Determine which step to resume at
          let currentStep: FlowStep = 'upload';
          if (brief.pink_brief) {
            currentStep = 'brief';
          } else if (brief.marketing_summary) {
            currentStep = 'strategy';
          } else if (brief.selected_insight_id !== null) {
            currentStep = 'strategy';
          } else if (brief.insights_data) {
            currentStep = 'insights';
          }

          set({
            briefId: brief.id,
            product: brief.product_id
              ? { id: brief.product_id, name: brief.product?.name || 'Unknown', isOther: false }
              : { id: null, name: brief.product_name_override || 'Unknown', isOther: true },
            sourceDocuments: brief.source_documents || [],
            rawDocumentText: brief.source_documents?.[0]?.raw_text || '',
            categoryContext: brief.insights_data?.category_context || '',
            insights: brief.insights_data?.insights || [],
            selectedInsightId: brief.selected_insight_id,
            marketingSummary: brief.marketing_summary,
            pinkBrief: brief.pink_brief,
            currentStep,
            isSaving: false,
            lastSaved: brief.updated_at,
          });
        } catch (error) {
          set({ isSaving: false });
          throw error;
        }
      },

      saveDraft: async () => {
        const state = get();
        console.log('[Store] saveDraft called - state:', {
          briefId: state.briefId,
          selectedInsightId: state.selectedInsightId,
          insightsCount: state.insights.length,
          hasRawText: !!state.rawDocumentText,
        });

        if (!state.briefId) {
          console.log('[Store] saveDraft skipped: no briefId');
          return;
        }

        // Don't save if the store hasn't been properly loaded (would overwrite DB with nulls)
        // At minimum, we need rawDocumentText to indicate data was loaded
        const hasLoadedData = state.rawDocumentText || state.insights.length > 0 ||
                              state.marketingSummary || state.pinkBrief;
        if (!hasLoadedData) {
          console.warn('[Store] saveDraft skipped: store has no loaded data');
          return;
        }

        set({ isSaving: true });

        try {
          // Only include fields that have actual data to avoid overwriting with nulls
          const updateData: Record<string, any> = {};

          if (state.sourceDocuments.length > 0) {
            updateData.source_documents = state.sourceDocuments;
          }

          if (state.insights.length > 0) {
            updateData.insights_data = {
              extraction_timestamp: new Date().toISOString(),
              model_used: useAIProviderStore.getState().provider === 'claude' ? 'claude-sonnet-4' : 'gemini-2.0-flash',
              category_context: state.categoryContext,
              insights: state.insights,
            };
            // Only save selected_insight_id if it's actually set - don't overwrite DB with null
            if (state.selectedInsightId !== null) {
              updateData.selected_insight_id = state.selectedInsightId;
            }
          }

          // ALSO save selected_insight_id independently if set (in case insights weren't loaded)
          if (state.selectedInsightId !== null && !updateData.selected_insight_id) {
            updateData.selected_insight_id = state.selectedInsightId;
          }

          if (state.marketingSummary) {
            updateData.marketing_summary = state.marketingSummary;
          }

          if (state.pinkBrief) {
            updateData.pink_brief = state.pinkBrief;
          }

          // Only update if we have something to save
          console.log('[Store] saveDraft updating with:', Object.keys(updateData));
          if (Object.keys(updateData).length > 0) {
            await briefService.update(state.briefId, updateData);
          }

          set({
            isSaving: false,
            lastSaved: new Date().toISOString()
          });
        } catch (error) {
          set({ isSaving: false });
          throw error;
        }
      },

      completeBrief: async () => {
        const state = get();
        if (!state.briefId) return;

        set({ isSaving: true });

        try {
          // Build complete update with all essential data
          const updateData: Record<string, any> = {
            status: 'complete',
            pink_brief: state.pinkBrief ? {
              ...state.pinkBrief,
              last_edited: new Date().toISOString(),
            } : null,
          };

          // Ensure selected_insight_id is saved (critical for regeneration)
          if (state.selectedInsightId !== null) {
            updateData.selected_insight_id = state.selectedInsightId;
          }

          // Ensure insights_data is saved if available
          if (state.insights.length > 0) {
            updateData.insights_data = {
              extraction_timestamp: new Date().toISOString(),
              model_used: useAIProviderStore.getState().provider === 'claude' ? 'claude-sonnet-4' : 'gemini-2.0-flash',
              category_context: state.categoryContext,
              insights: state.insights,
            };
          }

          // Ensure marketing_summary is saved if available
          if (state.marketingSummary) {
            updateData.marketing_summary = state.marketingSummary;
          }

          await briefService.update(state.briefId, updateData);

          set({
            isSaving: false,
            lastSaved: new Date().toISOString()
          });
        } catch (error) {
          set({ isSaving: false });
          throw error;
        }
      },

      setSourceDocument: (doc, rawText) => {
        set({
          sourceDocuments: [doc],
          rawDocumentText: rawText,
        });
        // Auto-save after setting
        get().saveDraft().catch(console.error);
      },

      setInsightsData: (categoryContext, insights) => {
        set({ categoryContext, insights });
        // Auto-save after setting
        get().saveDraft().catch(console.error);
      },

      selectInsight: (insightId) => {
        console.log('[Store] selectInsight called with:', insightId);
        set({ selectedInsightId: insightId });
        // Auto-save after setting
        const state = get();
        console.log('[Store] After selectInsight - state:', {
          briefId: state.briefId,
          selectedInsightId: state.selectedInsightId,
          insightsCount: state.insights.length,
        });
        get().saveDraft().catch(console.error);
      },

      setMarketingSummary: (summary) => {
        set({ marketingSummary: summary });
        // Auto-save after setting
        get().saveDraft().catch(console.error);
      },

      setPinkBrief: (brief) => {
        set({
          pinkBrief: {
            ...brief,
            version: (get().pinkBrief?.version || 0) + 1,
            last_edited: new Date().toISOString(),
          }
        });
        // Auto-save after setting
        get().saveDraft().catch(console.error);
      },

      reset: () => set(initialState),
    }),
    {
      name: 'brief-flow-storage',
      partialize: (state) => ({
        briefId: state.briefId,
        currentStep: state.currentStep,
        product: state.product,
        userName: state.userName,
      }),
    }
  )
);
