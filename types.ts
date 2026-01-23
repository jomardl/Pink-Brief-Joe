
export type ModuleId = 1 | 2 | 3 | 4;

export interface RedThreadStep {
  label: string;
  content: string;
  imagePrompt: string;
  userImage?: string; // Support for manual image uploads
}

export interface Mention {
  text: string;
  relevanceScore: number; 
}

export interface ExtractedInsight {
  insight: string;
  plainEnglishExplanation: string;
  rank: number;
  reasoning: string;
  verbatims: string[];
  mentions: Mention[];
  matchPercentage: number;
  mentionCount: number;
  totalEvidenceFrequency: string;
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

export interface StrategicSection {
  id: string;
  title: string;
  purpose: string;
  summary: string; // The blue gist paragraph
  content: string;
}

export interface Persona {
  name: string;
  description: string;
  insights: string[];
}

export interface BriefData {
  researchText: string;
  extractedInsights: ExtractedInsight[];
  selectedInsight: string;
  marketingSummarySections?: StrategicSection[];
  marketingSummary?: string; 
  redThreadEssence?: string;
  redThread?: RedThreadStep[];
  pinkBrief?: PinkBriefContent;
  strategicObjective?: string;
  targetAudience?: Persona;
  keyMessage?: string;
  tone?: string;
}

export const INITIAL_BRIEF_DATA: BriefData = {
  researchText: '',
  extractedInsights: [],
  selectedInsight: '',
  strategicObjective: '',
  targetAudience: { name: '', description: '', insights: [] },
  keyMessage: '',
  tone: '',
};
