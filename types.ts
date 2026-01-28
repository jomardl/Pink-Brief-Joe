
export type ModuleId = 1 | 2 | 3 | 4;

// ============================================
// INSIGHT TYPES (P&G Consumer Insights Format)
// ============================================

export interface InsightVerbatim {
  quote: string;
  source_location: string;
}

export type TensionType = "functional" | "emotional" | "social" | "identity";

export interface ExtractedInsight {
  id: number;
  insight_headline: string;  // Short summary, max 10 words
  insight_text: string;
  verbatims: InsightVerbatim[];
  relevance_score: number;  // 1-10 scale
  tension_type: TensionType;
  jtbd: string;  // "When [X], I want to [Y], so I can [Z]"
}

export interface InsightExtractionResult {
  insights: ExtractedInsight[];
  category_context: string;
}

// ============================================
// PINK BRIEF TYPES (P&G Strategic Framework)
// ============================================

export interface BusinessObjective {
  to_grow: string;
  we_need_to_get: string;
  to: string;
  by_forming_new_habit: string;
}

export interface ConsumerProblem {
  jtbd: string;
  current_behavior: string;
  struggle: string;
}

export interface CommunicationChallenge {
  from_state: string;
  to_state: string;
  analogy_or_device: string;
}

export interface MessageStrategy {
  benefit: string;
  rtb: string;
  brand_character: string;
}

export interface BriefInsight {
  insight_number: number;
  insight_text: string;
}

export interface SuccessMeasures {
  business: string;
  equity: string;
}

export interface Execution {
  key_media: string[];
  campaign_pillars: string[];
  key_considerations: string;
  success_measures: SuccessMeasures;
}

export interface PinkBriefContent {
  business_objective: BusinessObjective;
  consumer_problem: ConsumerProblem;
  communication_challenge: CommunicationChallenge;
  message_strategy: MessageStrategy;
  insights: BriefInsight[];
  execution: Execution;
}

// ============================================
// STRATEGIC SECTIONS (Deep Dive Module)
// ============================================

export interface StrategicSection {
  id: string;
  title: string;
  purpose: string;
  summary: string;
  content: string;
}

export interface RedThreadStep {
  label: string;
  content: string;
  imagePrompt: string;
  userImage?: string;
}

// ============================================
// DELIVERABLES
// ============================================

export interface Deliverable {
  touchpoint: string;
  messages: string[];
}

// ============================================
// MAIN BRIEF DATA (App State)
// ============================================

export interface BriefData {
  // Step 1: Research
  researchText: string;

  // Step 2: Insights
  extractedInsights: ExtractedInsight[];
  categoryContext: string;
  selectedInsight: ExtractedInsight | null;  // Full object, not just string

  // Step 3: Strategy (Deep Dive)
  marketingSummarySections: StrategicSection[];
  redThreadEssence: string;
  redThread: RedThreadStep[];

  // Step 4: Pink Brief
  pinkBrief: PinkBriefContent | null;

  // Manual inputs (user can override)
  manualInputs: {
    budget: string;
    inMarketDate: string;
    deliverables: Deliverable[];
  };
}

export const INITIAL_BRIEF_DATA: BriefData = {
  researchText: '',
  extractedInsights: [],
  categoryContext: '',
  selectedInsight: null,
  marketingSummarySections: [],
  redThreadEssence: '',
  redThread: [],
  pinkBrief: null,
  manualInputs: {
    budget: '',
    inMarketDate: '',
    deliverables: []
  }
};

// ============================================
// HELPER: Create empty Pink Brief
// ============================================

export const EMPTY_PINK_BRIEF: PinkBriefContent = {
  business_objective: {
    to_grow: '',
    we_need_to_get: '',
    to: '',
    by_forming_new_habit: ''
  },
  consumer_problem: {
    jtbd: '',
    current_behavior: '',
    struggle: ''
  },
  communication_challenge: {
    from_state: '',
    to_state: '',
    analogy_or_device: ''
  },
  message_strategy: {
    benefit: '',
    rtb: '',
    brand_character: ''
  },
  insights: [],
  execution: {
    key_media: [],
    campaign_pillars: [],
    key_considerations: '',
    success_measures: {
      business: '',
      equity: ''
    }
  }
};
