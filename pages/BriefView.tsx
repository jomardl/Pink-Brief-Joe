import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Link2, Check, FileText, Lightbulb, Target, FileOutput } from 'lucide-react';
import { briefService } from '../lib/services/briefService';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { useBriefFlowStore } from '../lib/stores/briefFlowStore';
import type { Brief } from '../lib/supabase/types';
import { BriefData, INITIAL_BRIEF_DATA, PinkBriefContent, ExtractedInsight } from '../types';
import SummaryModule from '../components/SummaryModule';
import ResearchViewer from '../components/viewers/ResearchViewer';
import InsightsViewer from '../components/viewers/InsightsViewer';
import StrategyViewer from '../components/viewers/StrategyViewer';

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
  const { loadBrief: loadBriefToStore } = useBriefFlowStore();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoadingForEdit, setIsLoadingForEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('brief');

  const copyLink = async () => {
    const url = `${window.location.origin}/brief/${id}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleContinueEditing = async () => {
    if (!id) return;
    setIsLoadingForEdit(true);
    try {
      await loadBriefToStore(id);
      navigate('/new');
    } catch (err) {
      console.error('Failed to load brief for editing:', err);
      setError('Failed to load brief for editing');
    } finally {
      setIsLoadingForEdit(false);
    }
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

    const selectedInsight: ExtractedInsight | null = dbBrief.insights_data?.insights && dbBrief.selected_insight_id !== null
      ? dbBrief.insights_data.insights.find(i => i.id === dbBrief.selected_insight_id) as ExtractedInsight || null
      : null;

    return {
      ...INITIAL_BRIEF_DATA,
      researchText: dbBrief.source_documents?.[0]?.raw_text || '',
      extractedInsights: (dbBrief.insights_data?.insights || []) as ExtractedInsight[],
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
        <header className="h-12 bg-[#161616] flex items-center px-4">
          <button
            onClick={() => navigate('/briefs')}
            className="text-white text-sm font-medium tracking-tight hover:text-[#a8a8a8] transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Repository
          </button>
        </header>

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

  // If brief has pink_brief content OR is marked complete, show the tabbed view
  if (brief.pink_brief || brief.status === 'complete') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
        <header className="h-12 bg-[#161616] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/briefs')}
              className="text-white text-sm font-medium tracking-tight hover:text-[#a8a8a8] transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <span className="mx-3 text-[#525252]">/</span>
            <span className="text-[#c6c6c6] text-sm">{brief.title}</span>
          </div>
          <button
            onClick={copyLink}
            className="h-8 px-3 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#393939] transition-colors rounded"
          >
            {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
            {linkCopied ? 'Copied!' : 'Copy Link'}
          </button>
        </header>

        {/* Tab navigation */}
        <div className="border-b border-[#e0e0e0] bg-white shrink-0">
          <div className="max-w-5xl mx-auto flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
            />
          )}
          {activeTab === 'strategy' && (
            <StrategyViewer
              redThreadEssence={briefData.redThreadEssence}
              redThreadUnlock={brief.marketing_summary?.red_thread_unlock || ''}
              sections={briefData.marketingSummarySections}
            />
          )}
          {activeTab === 'brief' && (
            <div className="max-w-5xl mx-auto p-8">
              <SummaryModule
                briefData={briefData}
                onReset={handleReset}
                onProcessing={() => {}}
              />
            </div>
          )}
        </main>
      </div>
    );
  }

  // If it's a draft without pink_brief, redirect to continue editing
  // For now, show a simple view
  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <header className="h-12 bg-[#161616] flex items-center px-4">
        <button
          onClick={() => navigate('/briefs')}
          className="text-white text-sm font-medium tracking-tight hover:text-[#a8a8a8] transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Repository
        </button>
        <span className="mx-3 text-[#525252]">/</span>
        <span className="text-[#c6c6c6] text-sm">{brief.title}</span>
      </header>

      <main className="max-w-5xl mx-auto p-8">
        <div className="p-6 bg-white border border-[#e0e0e0]">
          <h2 className="text-xl font-light text-[#161616] mb-4">{brief.title}</h2>
          <p className="text-sm text-[#6f6f6f] mb-6">
            This brief is still in draft status. Resume editing to complete it.
          </p>

          <div className="flex gap-4">
            <button
              onClick={handleContinueEditing}
              disabled={isLoadingForEdit}
              className="h-10 px-4 bg-[#0f62fe] text-white text-sm font-medium hover:bg-[#0353e9] transition-colors disabled:opacity-50"
            >
              {isLoadingForEdit ? 'Loading...' : 'Continue Editing'}
            </button>
            <button
              onClick={() => navigate('/briefs')}
              className="h-10 px-4 text-[#525252] text-sm font-medium hover:bg-[#f4f4f4] transition-colors"
            >
              Back to Repository
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BriefView;
