import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Link2, Check, FileText, Lightbulb, Target, FileOutput } from 'lucide-react';
import { briefService } from '../lib/services/briefService';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { useBriefFlowStore } from '../lib/stores/briefFlowStore';
import type { Brief } from '../lib/supabase/types';
import { BriefData, INITIAL_BRIEF_DATA, PinkBriefContent, ExtractedInsight, StrategicSection } from '../types';
import SummaryModule from '../components/SummaryModule';
import ResearchViewer from '../components/viewers/ResearchViewer';
import InsightsViewer from '../components/viewers/InsightsViewer';
import StrategyViewer from '../components/viewers/StrategyViewer';
import ConfirmDialog from '../components/ConfirmDialog';
import Header from '../components/Header';

type TabId = 'research' | 'insights' | 'strategy' | 'brief';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'research', label: 'Research', icon: FileText },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'brief', label: 'Brief', icon: FileOutput },
];

const BriefView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('brief');
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [isDuplicatingForInsight, setIsDuplicatingForInsight] = useState(false);
  const [isGeneratingNewStrategy, setIsGeneratingNewStrategy] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/brief/${id}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleContinueEditing = () => {
    if (!id) return;
    // Navigate to /new/:id - BriefFlow will load the brief from the URL param
    navigate(`/new/${id}`);
  };

  useEffect(() => {
    if (!id) {
      setError('No brief ID provided');
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Database not configured');
      setIsLoading(false);
      return;
    }

    loadBrief(id);
  }, [id]);

  // Redirect drafts without pink_brief to BriefFlow for editing
  useEffect(() => {
    if (brief && !brief.pink_brief && brief.status !== 'complete') {
      navigate(`/new/${id}`, { replace: true });
    }
  }, [brief, id, navigate]);

  const loadBrief = async (briefId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await briefService.getById(briefId);
      setBrief(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load brief');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    navigate('/briefs');
  };

  // Handle strategy updates
  const handleStrategyUpdate = async (data: { redThreadEssence?: string; redThreadUnlock?: string; sections?: StrategicSection[] }) => {
    if (!brief || !id) return;

    // Update local state
    const updatedMarketingSummary = {
      ...brief.marketing_summary,
      red_thread_essence: data.redThreadEssence ?? brief.marketing_summary?.red_thread_essence ?? '',
      red_thread_unlock: data.redThreadUnlock ?? brief.marketing_summary?.red_thread_unlock ?? '',
      sections: data.sections ?? brief.marketing_summary?.sections ?? [],
    };

    setBrief(prev => prev ? {
      ...prev,
      marketing_summary: updatedMarketingSummary,
    } : null);

    // Save to database
    try {
      await briefService.update(id, {
        marketing_summary: updatedMarketingSummary,
      });
    } catch (err) {
      console.error('Failed to save strategy updates:', err);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
  };

  // Handle explicit regeneration request from Strategy viewer
  const handleRequestRegenerate = () => {
    if (brief?.pink_brief) {
      setShowRegenerateDialog(true);
    }
  };

  // Handle regeneration confirmation
  const handleConfirmRegenerate = async () => {
    setShowRegenerateDialog(false);
    setIsRegenerating(true);
    // Clear the pink brief to trigger regeneration in SummaryModule
    if (brief && id) {
      // Debug: Log brief data before syncing
      console.log('[BriefView] handleConfirmRegenerate - brief data:', {
        hasInsightsData: !!brief.insights_data,
        insightsCount: brief.insights_data?.insights?.length,
        selectedInsightId: brief.selected_insight_id,
        categoryContext: brief.insights_data?.category_context,
      });

      // Sync insight data to store so SummaryModule's fallback can access it
      const store = useBriefFlowStore.getState();
      if (brief.insights_data?.insights && brief.insights_data.insights.length > 0) {
        const insights = brief.insights_data.insights;

        // Ensure all insights have an id (use index+1 as fallback)
        const insightsWithIds = insights.map((insight, index) => ({
          ...insight,
          id: insight.id ?? (index + 1),
        }));

        const firstInsight = insightsWithIds[0];

        // Use selected_insight_id if available, otherwise fall back to first insight's id
        const selectedId = brief.selected_insight_id ?? firstInsight.id;

        console.log('[BriefView] Syncing insights to store:', {
          insightsCount: insightsWithIds.length,
          selectedId,
          usedFallback: brief.selected_insight_id == null,
          firstInsightId: firstInsight.id,
          firstInsightHadId: insights[0]?.id != null,
        });

        store.setInsightsData(
          brief.insights_data.category_context || '',
          insightsWithIds
        );

        store.selectInsight(selectedId);

        console.log('[BriefView] Store after sync:', {
          insights: useBriefFlowStore.getState().insights?.length,
          selectedInsightId: useBriefFlowStore.getState().selectedInsightId,
        });
      } else {
        console.warn('[BriefView] Could not sync - no insights data');
      }

      setBrief(prev => prev ? { ...prev, pink_brief: null } : null);
      try {
        await briefService.update(id, { pink_brief: null, status: 'draft' });
      } catch (err) {
        console.error('Failed to clear brief:', err);
      }
    }
    setActiveTab('brief');
  };

  // Handle skip regeneration
  const handleSkipRegenerate = () => {
    setShowRegenerateDialog(false);
  };

  // Handle selecting a different insight - duplicates the brief with new insight
  const handleSelectDifferentInsight = async (newInsightId: number) => {
    if (!id || !brief) return;

    setIsDuplicatingForInsight(true);
    try {
      // Duplicate the brief
      const newBrief = await briefService.duplicate(id);

      // Update the duplicated brief with the new insight selection (clears downstream data)
      await briefService.update(newBrief.id, {
        selected_insight_id: newInsightId,
        marketing_summary: null, // Clear strategy - needs regeneration
        pink_brief: null, // Clear brief - needs regeneration
        status: 'draft',
      });

      // Navigate to the new brief in edit mode
      navigate(`/brief/${newBrief.id}`);
    } catch (err) {
      console.error('Failed to create new version with different insight:', err);
    } finally {
      setIsDuplicatingForInsight(false);
    }
  };

  // Handle generating a new strategy from Insights screen - duplicates and clears strategy + brief
  const handleGenerateNewStrategy = async () => {
    if (!id || !brief) return;

    setIsGeneratingNewStrategy(true);
    try {
      // Duplicate the brief
      const newBrief = await briefService.duplicate(id);

      // Clear strategy and brief to trigger regeneration
      await briefService.update(newBrief.id, {
        marketing_summary: null,
        pink_brief: null,
        status: 'draft',
      });

      // Navigate to the new brief
      navigate(`/brief/${newBrief.id}`);
    } catch (err) {
      console.error('Failed to create new strategy version:', err);
    } finally {
      setIsGeneratingNewStrategy(false);
    }
  };

  // Convert DB brief to BriefData format for SummaryModule
  const convertToBriefData = (dbBrief: Brief): BriefData => {
    const pinkBrief: PinkBriefContent | null = dbBrief.pink_brief ? {
      business_objective: dbBrief.pink_brief.business_objective,
      consumer_problem: dbBrief.pink_brief.consumer_problem,
      communication_challenge: dbBrief.pink_brief.communication_challenge,
      message_strategy: dbBrief.pink_brief.message_strategy,
      insights: dbBrief.pink_brief.insights,
      execution: dbBrief.pink_brief.execution,
    } : null;

    // Ensure insights have IDs (use index+1 as fallback for old data)
    const insightsWithIds = (dbBrief.insights_data?.insights || []).map((insight, index) => ({
      ...insight,
      id: insight.id ?? (index + 1),
    })) as ExtractedInsight[];

    // Debug logging
    console.log('[convertToBriefData] Input:', {
      hasInsightsData: !!dbBrief.insights_data,
      insightsCount: insightsWithIds.length,
      selectedInsightId: dbBrief.selected_insight_id,
      hasPinkBrief: !!dbBrief.pink_brief,
    });

    // Find selected insight - try by ID first, then fall back to first insight
    let selectedInsight: ExtractedInsight | null = null;
    if (insightsWithIds.length > 0) {
      if (dbBrief.selected_insight_id != null) {
        selectedInsight = insightsWithIds.find(i => Number(i.id) === Number(dbBrief.selected_insight_id)) || null;
      }
      // If no selected_insight_id or not found, fall back to first insight
      if (!selectedInsight) {
        selectedInsight = insightsWithIds[0];
        console.log('[convertToBriefData] Using first insight as fallback, id:', selectedInsight.id);
      }
    }

    console.log('[convertToBriefData] selectedInsight:', selectedInsight ? `found (id=${selectedInsight.id})` : 'null');

    return {
      ...INITIAL_BRIEF_DATA,
      researchText: dbBrief.source_documents?.[0]?.raw_text || '',
      extractedInsights: insightsWithIds,
      categoryContext: dbBrief.insights_data?.category_context || '',
      selectedInsight,
      marketingSummarySections: dbBrief.marketing_summary?.sections || [],
      redThreadEssence: dbBrief.marketing_summary?.red_thread_essence || '',
      pinkBrief,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="text-[#0f62fe] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6f6f6f]">Loading brief...</p>
        </div>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen bg-[#f4f4f4]">
        <Header
          breadcrumbs={[
            { label: 'Brief Repository', href: '/briefs' },
          ]}
        />

        <main className="max-w-5xl mx-auto p-8">
          <div className="flex items-center gap-3 p-4 bg-[#fff1f1] border-l-4 border-[#da1e28]">
            <AlertCircle size={20} className="text-[#da1e28]" />
            <div>
              <p className="text-sm font-medium text-[#161616]">Error loading brief</p>
              <p className="text-sm text-[#525252]">{error || 'Brief not found'}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const briefData = convertToBriefData(brief);

  // If brief has pink_brief content OR is marked complete OR we're regenerating, show the tabbed view
  if (brief.pink_brief || brief.status === 'complete' || isRegenerating) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
        <Header
          breadcrumbs={[
            { label: 'Brief Repository', href: '/briefs' },
            { label: brief.title },
          ]}
        >
          <button
            onClick={copyLink}
            className="h-8 px-3 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#393939] transition-colors rounded"
          >
            {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
            {linkCopied ? 'Copied!' : 'Copy Link'}
          </button>
        </Header>

        {/* Tab navigation */}
        <div className="border-b border-[#e0e0e0] bg-white shrink-0">
          <div className="max-w-5xl mx-auto flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-[#0f62fe] text-[#0f62fe]'
                      : 'border-transparent text-[#525252] hover:text-[#161616]'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          {activeTab === 'research' && (
            <ResearchViewer
              sourceDocument={brief.source_documents?.[0] || null}
              rawText={briefData.researchText}
            />
          )}
          {activeTab === 'insights' && (
            <InsightsViewer
              insights={briefData.extractedInsights}
              selectedInsightId={brief.selected_insight_id}
              categoryContext={briefData.categoryContext}
              onSelectDifferentInsight={brief.status === 'complete' ? handleSelectDifferentInsight : undefined}
              isSelectingInsight={isDuplicatingForInsight}
              hasStrategy={!!brief.marketing_summary}
              onGenerateNewStrategy={brief.status === 'complete' ? handleGenerateNewStrategy : undefined}
              isGeneratingStrategy={isGeneratingNewStrategy}
            />
          )}
          {activeTab === 'strategy' && (
            <StrategyViewer
              redThreadEssence={brief.marketing_summary?.red_thread_essence || ''}
              redThreadUnlock={brief.marketing_summary?.red_thread_unlock || ''}
              sections={brief.marketing_summary?.sections || []}
              onUpdate={handleStrategyUpdate}
              hasBrief={!!brief.pink_brief}
              onRequestRegenerate={handleRequestRegenerate}
            />
          )}
          {activeTab === 'brief' && (
            <div className="max-w-5xl mx-auto p-8">
              <SummaryModule
                briefData={briefData}
                onReset={handleReset}
                onProcessing={() => {}}
                isAlreadySaved={brief.status === 'complete'}
                storedModelUsed={brief.insights_data?.model_used || null}
              />
            </div>
          )}
        </main>

        {/* Regeneration confirmation dialog */}
        <ConfirmDialog
          isOpen={showRegenerateDialog}
          title="Regenerate Brief?"
          message="You've edited the strategy. Would you like to regenerate the Pink Brief based on your changes? This will replace the current brief content."
          confirmLabel="Regenerate"
          cancelLabel="Keep Current Brief"
          variant="warning"
          onConfirm={handleConfirmRegenerate}
          onCancel={handleSkipRegenerate}
        />
      </div>
    );
  }

  // This is a fallback return - should not normally be reached
  // If we get here, it means brief exists but doesn't match any condition above
  return null;
};

export default BriefView;
