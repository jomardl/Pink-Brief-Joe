
export type ModuleId = 1 | 2 | 3 | 4 | 5;

export interface RedThreadStep {
  label: string;
  content: string;
  imagePrompt: string;
}

export interface ExtractedInsight {
  insight: string;
  plainEnglishExplanation: string;
  rank: number;
  reasoning: string;
  verbatims: string[];
  matchPercentage: number;
  mentionCount: number;
}

export interface BriefData {
  researchText: string;
  extractedInsights: ExtractedInsight[];
  selectedInsight: string;
  redThreadEssence: string;
  strategicObjective: string;
  redThread: RedThreadStep[];
  targetAudience: {
    name: string;
    description: string;
    insights: string[];
  };
  keyMessage: string;
  tone: string;
  brandVoice: string;
}

export interface ModuleStatus {
  id: ModuleId;
  title: string;
  description: string;
  isCompleted: boolean;
}

export const INITIAL_BRIEF_DATA: BriefData = {
  researchText: '',
  extractedInsights: [],
  selectedInsight: '',
  redThreadEssence: '',
  strategicObjective: '',
  redThread: [
    { label: 'Product', content: '', imagePrompt: 'clean product shot' },
    { label: 'Packaging', content: '', imagePrompt: 'premium packaging' },
    { label: 'Communication', content: '', imagePrompt: 'lifestyle marketing visual' },
    { label: 'Instore', content: '', imagePrompt: 'retail shelf display' },
    { label: 'Value Equation', content: '', imagePrompt: 'value offer graphic' }
  ],
  targetAudience: {
    name: '',
    description: '',
    insights: [],
  },
  keyMessage: '',
  tone: '',
  brandVoice: '',
};
