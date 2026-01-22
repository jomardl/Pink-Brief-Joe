
export type ModuleId = 1 | 2 | 3 | 4;

export interface RedThreadStep {
  label: string;
  content: string;
  imagePrompt: string;
}

export interface Mention {
  text: string;
  relevanceScore: number; // 0-100 scale
}

export interface ExtractedInsight {
  insight: string;
  plainEnglishExplanation: string;
  rank: number;
  reasoning: string;
  verbatims: string[]; // Legacy
  mentions: Mention[];
  matchPercentage: number;
  mentionCount: number; // Strictly the number of quotes in the 'mentions' array
  totalEvidenceFrequency: string; // e.g., "32 mentions across 15 documents"
}

export interface Deliverable {
  touchpoint: string;
  messages: string[];
}

export interface PinkBriefContent {
  locationBrandProject: string;
  toGrow: string;
  needToPrevent: string;
  andObjective: string;
  byForming: string;
  jtbd: string;
  consumerCurrently: string;
  struggleWith: string;
  commChallenge: string;
  benefit: string;
  rtb: string;
  brandCharacter: string;
  insight1: string;
  insight2: string;
  keyMedia: string;
  budget: string;
  inMarketDate: string;
  successMeasuresBusiness: string;
  successMeasuresEquity: string;
  deliverables: Deliverable[];
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
  pinkBrief?: PinkBriefContent;
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
