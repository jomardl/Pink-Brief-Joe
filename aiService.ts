// AI Service - Provider-agnostic wrapper
// Delegates to either Gemini or Claude based on store setting

import { useAIProviderStore, type AIProvider } from './lib/stores/aiProviderStore';
import * as gemini from './geminiService';
import * as claude from './claudeService';
import { ExtractedInsight, PinkBriefContent, InsightExtractionResult } from './types';

// Get current provider from store
const getProvider = (): AIProvider => {
  return useAIProviderStore.getState().provider;
};

// ============================================
// INSIGHT EXTRACTION
// ============================================

export const extractRankedInsights = async (text: string): Promise<InsightExtractionResult> => {
  const provider = getProvider();
  console.log(`[AI Service] Using ${provider} for insight extraction`);

  if (provider === 'claude') {
    return claude.extractRankedInsights(text);
  }
  return gemini.extractRankedInsights(text);
};

// ============================================
// BESPOKE INSIGHT TESTING
// ============================================

export const testBespokeInsight = async (text: string, userInsight: string): Promise<ExtractedInsight> => {
  const provider = getProvider();
  console.log(`[AI Service] Using ${provider} for bespoke insight testing`);

  if (provider === 'claude') {
    return claude.testBespokeInsight(text, userInsight);
  }
  return gemini.testBespokeInsight(text, userInsight);
};

// ============================================
// PINK BRIEF GENERATION
// ============================================

export const generatePinkBrief = async (
  insight: ExtractedInsight,
  categoryContext: string,
  researchText: string
): Promise<PinkBriefContent> => {
  const provider = getProvider();
  console.log(`[AI Service] Using ${provider} for Pink Brief generation`);

  if (provider === 'claude') {
    return claude.generatePinkBrief(insight, categoryContext, researchText);
  }
  return gemini.generatePinkBrief(insight, categoryContext, researchText);
};

// ============================================
// STRATEGIC SYNTHESIS (Deep Dive Module)
// ============================================

export const performStrategicSynthesis = async (research: string, insight: string) => {
  const provider = getProvider();
  console.log(`[AI Service] Using ${provider} for strategic synthesis`);

  if (provider === 'claude') {
    return claude.performStrategicSynthesis(research, insight);
  }
  return gemini.performStrategicSynthesis(research, insight);
};
