// Database types for Supabase tables

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      briefs: {
        Row: Brief;
        Insert: BriefInsert;
        Update: BriefUpdate;
      };
    };
    Views: {
      briefs_with_products: {
        Row: BriefWithProduct;
      };
    };
  };
}

// Products table
export interface Product {
  id: string;
  name: string;
  brand: string;
  market: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  name: string;
  brand: string;
  market?: string | null;
  category?: string | null;
  is_active?: boolean;
}

export interface ProductUpdate {
  name?: string;
  brand?: string;
  market?: string | null;
  category?: string | null;
  is_active?: boolean;
}

// Briefs table
export interface Brief {
  id: string;
  product_id: string | null;
  product_name_override: string | null;
  title: string;
  created_by: string | null;
  status: 'draft' | 'complete' | 'archived';
  source_documents: SourceDocument[];
  insights_data: InsightsData | null;
  selected_insight_id: number | null;
  marketing_summary: MarketingSummary | null;
  pink_brief: PinkBriefData | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BriefInsert {
  product_id?: string | null;
  product_name_override?: string | null;
  title: string;
  created_by?: string | null;
  status?: 'draft' | 'complete' | 'archived';
  source_documents?: SourceDocument[];
  insights_data?: InsightsData | null;
  selected_insight_id?: number | null;
  marketing_summary?: MarketingSummary | null;
  pink_brief?: PinkBriefData | null;
}

export interface BriefUpdate {
  product_id?: string | null;
  product_name_override?: string | null;
  title?: string;
  created_by?: string | null;
  status?: 'draft' | 'complete' | 'archived';
  source_documents?: SourceDocument[];
  insights_data?: InsightsData | null;
  selected_insight_id?: number | null;
  marketing_summary?: MarketingSummary | null;
  pink_brief?: PinkBriefData | null;
  completed_at?: string | null;
}

// View type
export interface BriefWithProduct {
  id: string;
  title: string;
  created_by: string | null;
  status: 'draft' | 'complete' | 'archived';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  product_name: string;
  brand: string;
  market: string | null;
  category: string | null;
}

// JSONB structures
export interface SourceDocument {
  filename: string;
  file_type: string;
  upload_timestamp: string;
  file_size_bytes: number;
  raw_text?: string;
}

export interface InsightsData {
  extraction_timestamp: string;
  model_used: string;
  category_context: string;
  insights: ExtractedInsightDB[];
}

export interface ExtractedInsightDB {
  id: number;
  insight_headline: string;
  insight_text: string;
  verbatims: {
    quote: string;
    source_location: string;
  }[];
  relevance_score: number;
  tension_type: 'functional' | 'emotional' | 'social' | 'identity';
  jtbd: string;
}

export interface MarketingSummary {
  red_thread_essence: string;
  red_thread_unlock: string;
  sections: {
    id: string;
    title: string;
    purpose: string;
    summary: string;
    content: string;
  }[];
}

export interface PinkBriefData {
  version: number;
  last_edited: string;
  business_objective: {
    to_grow: string;
    we_need_to_get: string;
    to: string;
    by_forming_new_habit: string;
  };
  consumer_problem: {
    jtbd: string;
    current_behavior: string;
    struggle: string;
  };
  communication_challenge: {
    from_state: string;
    to_state: string;
    analogy_or_device: string;
  };
  message_strategy: {
    benefit: string;
    rtb: string;
    brand_character: string;
  };
  insights: {
    insight_number: number;
    insight_text: string;
  }[];
  execution: {
    key_media: string[];
    campaign_pillars: string[];
    key_considerations: string;
    success_measures: {
      business: string;
      equity: string;
    };
  };
}
