import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { briefService } from '../lib/services/briefService';
import { isSupabaseConfigured } from '../lib/supabase/client';
import type { Brief } from '../lib/supabase/types';
import { BriefData, INITIAL_BRIEF_DATA, PinkBriefContent, ExtractedInsight } from '../types';
import SummaryModule from '../components/SummaryModule';

const BriefView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // If brief has pink_brief content, show the summary view
  if (brief.pink_brief) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
        <header className="h-12 bg-[#161616] flex items-center px-4 shrink-0">
          <button
            onClick={() => navigate('/briefs')}
            className="text-white text-sm font-medium tracking-tight hover:text-[#a8a8a8] transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="mx-3 text-[#525252]">/</span>
          <span className="text-[#c6c6c6] text-sm">{brief.title}</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-8">
            <SummaryModule
              briefData={briefData}
              onReset={handleReset}
              onProcessing={() => {}}
            />
          </div>
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
              onClick={() => {
                // TODO: Implement resume editing by loading brief state
                navigate('/new');
              }}
              className="h-10 px-4 bg-[#0f62fe] text-white text-sm font-medium hover:bg-[#0353e9] transition-colors"
            >
              Continue Editing
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
