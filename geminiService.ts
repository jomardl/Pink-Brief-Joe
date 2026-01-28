
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedInsight, PinkBriefContent, InsightExtractionResult } from "./types";

// ============================================
// PROMPTS
// ============================================

const INSIGHT_EXTRACTION_INSTRUCTIONS = `
You are a P&G Consumer Insights Analyst. Your task is to extract and generate consumer insights from market research documents.

## OUTPUT REQUIREMENTS

Generate 3-5 consumer insights. Each insight MUST:
1. Be written in FIRST-PERSON CONSUMER VOICE ("I...", "As a...", "When I...")
2. Follow the structure: CONTEXT → CURRENT BEHAVIOR → TENSION/STRUGGLE
3. Be 2-4 sentences maximum
4. Reveal an emotional or functional tension the brand can solve

## INSIGHT STRUCTURE TEMPLATE

"[Identity/Context statement]. [Current behavior or belief]. But [tension/struggle/contradiction]."

## EXAMPLES OF GOOD INSIGHTS

✓ "I have an active lifestyle and am constantly on the go. But during my periods, wearing a thick pad for protection feels bulky and uncomfortable, while wearing a thin pad gives me constant worry that my pad won't give me the protection I need."

✓ "As an empowered independent girl, I try to forget that I am on my period to live my life as usual, but either leaks or discomfort keep bringing me back to reality!"

## EXAMPLES OF BAD INSIGHTS (DO NOT GENERATE THESE)

✗ "Consumers prefer thin pads but worry about protection." (Third-person, analytical)
✗ "There is a gap in the market for medium-thickness pads." (Business language, not consumer voice)
✗ "Young women aged 18-25 show preference for..." (Demographic description, not insight)

## FOR EACH INSIGHT, ALSO PROVIDE:

1. **insight_headline**: A punchy, memorable summary of the core tension in MAXIMUM 10 WORDS. This should capture the essence of the insight in a headline format. Examples:
   - "Protection vs. Comfort: The Daily Dilemma"
   - "Price Anxiety Undermines Brand Loyalty"
   - "Thin Pads, Thick Worries"
   - "Reliability Clashes with Rising Costs"
2. **verbatims**: Array of 2-4 direct quotes from the source document that support this insight
3. **relevance_score**: 1-10 score based on how directly the verbatims support the insight
4. **tension_type**: One of ["functional", "emotional", "social", "identity"]
5. **jtbd**: The underlying Job To Be Done in format "When [situation], I want to [motivation], so I can [outcome]"

## OUTPUT FORMAT

Return valid JSON only.
`;

const PINK_BRIEF_GENERATION_INSTRUCTIONS = `
You are a P&G Brand Strategy Director. Your task is to generate a Pink Brief using the P&G strategic framework.

## INPUT YOU WILL RECEIVE
- Selected consumer insight (first-person statement)
- Supporting verbatims
- Product/brand information
- Market context

## OUTPUT: COMPLETE PINK BRIEF

Generate ALL sections below using EXACT P&G terminology and sentence structures.

### SECTION 1: WHO-INSPIRED BUSINESS OBJECTIVE
Use fill-in-the-blank structure:
- to_grow: "[BRAND NAME] in [MARKET]"
- we_need_to_get: "[TARGET CONSUMER DESCRIPTION - specific about their current behavior]"
- to: "[ACTION: Trade Up / Trade In / Switch / Trial] to [PRODUCT LINE]"
- by_forming_new_habit: "[SPECIFIC NEW BEHAVIOR with product]"

### SECTION 2: CONSUMER'S PROBLEM TO SOLVE
- jtbd: "[Job To Be Done - functional outcome sought]"
- current_behavior: "This consumer currently [DOES WHAT] because [REASON]"
- struggle: "But this leads them to struggle with [SPECIFIC TENSION]"

### SECTION 3: COMMUNICATION CHALLENGE
Transformation framing:
- from_state: "[Current consumer mindset/belief]"
- to_state: "[Desired consumer mindset after seeing communication]"
- analogy_or_device: "[Mental/visual analogy that bridges the gap]"

### SECTION 4: COMMUNICATION MESSAGE STRATEGY
- benefit: "[Consumer-facing benefit statement, max 12 words]"
- rtb: "[Reason To Believe - product feature/proof]"
- brand_character: "[Brand personality in 2-3 descriptors + tone]"

### SECTION 5: CONSUMER INSIGHTS
Return the selected insight plus 1 complementary insight, both in first-person voice.

### SECTION 6: EXECUTION GUIDANCE
- key_media: Array of 2-3 primary channels
- campaign_pillars: Array of 3 visual/tonal elements
- key_considerations: What to register/leverage
- success_measures: { business: "[goal]", equity: "[attributes to own]" }

## CRITICAL RULES
1. NEVER use generic marketing language. Be SPECIFIC.
2. Headlines and benefits: MAX 8-12 words.
3. Consumer voice sections MUST use "I" or "my" language.
4. RTB must be a PRODUCT TRUTH, not a claim.
5. All fields must be populated.

Return valid JSON only.
`;

const STRATEGIST_INSTRUCTIONS = `
You are a Senior Brand Strategist at P&G. Synthesize raw data into a logical narrative.

TASK: Generate a Marketing Summary with 5 distinct sections and a "Red Thread" essence/unlock.
STYLE: Professional, analytical, persuasive. Use rich paragraphs for sections.

SECTIONS:
1. Business Landscape & Competitive Reality
2. Behavioral Deep-Dive
3. Strategic Tension & "The Unlock"
4. The Brand's Right to Win
5. Creative & Cultural Direction

OUTPUT: Valid JSON only.
`;

// ============================================
// CONFIG
// ============================================

const FLASH_MODEL = "gemini-2.0-flash";
const PRO_MODEL = "gemini-2.0-flash";

const DETERMINISTIC_CONFIG = {
  temperature: 0.1,
  seed: 42,
};

const pruneText = (text: string, limit = 6000) => {
  if (!text) return "";
  return text.length <= limit ? text : text.substring(0, limit) + "...";
};

const cleanAndParseJSON = (text: string) => {
  try {
    if (!text) throw new Error("Empty input");

    try { return JSON.parse(text); } catch (e) { }

    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) start = Math.min(firstBrace, firstBracket);
    else if (firstBrace !== -1) start = firstBrace;
    else if (firstBracket !== -1) start = firstBracket;

    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    if (start !== -1 && end !== -1 && end > start) {
      const cleaned = text.substring(start, end + 1);
      return JSON.parse(cleaned);
    }

    const stripped = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(stripped);
  } catch (err) {
    console.error("JSON Parse Error:", err);
    return null;
  }
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed.`, error.message);
      if (i < maxRetries) await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError;
}

// ============================================
// INSIGHT EXTRACTION (NEW P&G FORMAT)
// ============================================

export const extractRankedInsights = async (text: string): Promise<InsightExtractionResult> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Extract consumer insights from this research document:\n\n${pruneText(text)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: INSIGHT_EXTRACTION_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  insight_headline: { type: Type.STRING },
                  insight_text: { type: Type.STRING },
                  verbatims: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        quote: { type: Type.STRING },
                        source_location: { type: Type.STRING }
                      },
                      required: ["quote", "source_location"]
                    }
                  },
                  relevance_score: { type: Type.INTEGER },
                  tension_type: { type: Type.STRING },
                  jtbd: { type: Type.STRING }
                },
                required: ["id", "insight_headline", "insight_text", "verbatims", "relevance_score", "tension_type", "jtbd"]
              }
            },
            category_context: { type: Type.STRING }
          },
          required: ["insights", "category_context"]
        }
      }
    });

    const content = cleanAndParseJSON(response.text);
    if (!content || !content.insights) throw new Error("Invalid insights response");

    return {
      insights: content.insights as ExtractedInsight[],
      category_context: content.category_context || ""
    };
  });
};

// ============================================
// BESPOKE INSIGHT TESTING
// ============================================

export const testBespokeInsight = async (text: string, userInsight: string): Promise<ExtractedInsight> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Test this hypothesis against the research: "${userInsight}"\n\nResearch:\n${pruneText(text)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: `You are a P&G Consumer Insights Analyst. Evaluate if the given hypothesis is supported by the research.

If supported, return a refined first-person consumer insight following this structure:
"[Identity/Context]. [Current behavior]. But [tension/struggle]."

Also provide an insight_headline: a punchy summary of the core tension in MAXIMUM 10 WORDS.

Find verbatims from the research that support or contradict this hypothesis.
Score relevance 1-10 based on evidence strength.
If the hypothesis is NOT supported (score < 5), still return it but explain why in the insight_text.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            insight_headline: { type: Type.STRING },
            insight_text: { type: Type.STRING },
            verbatims: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  source_location: { type: Type.STRING }
                },
                required: ["quote", "source_location"]
              }
            },
            relevance_score: { type: Type.INTEGER },
            tension_type: { type: Type.STRING },
            jtbd: { type: Type.STRING }
          },
          required: ["id", "insight_headline", "insight_text", "verbatims", "relevance_score", "tension_type", "jtbd"]
        }
      }
    });

    const content = cleanAndParseJSON(response.text);
    if (!content) throw new Error("Invalid bespoke insight response");

    return {
      id: 99,
      insight_headline: content.insight_headline || "Custom Insight",
      insight_text: content.insight_text,
      verbatims: content.verbatims || [],
      relevance_score: content.relevance_score || 0,
      tension_type: content.tension_type || "functional",
      jtbd: content.jtbd || ""
    };
  });
};

// ============================================
// PINK BRIEF GENERATION (NEW P&G FORMAT)
// ============================================

export const generatePinkBrief = async (
  insight: ExtractedInsight,
  categoryContext: string,
  researchText: string
): Promise<PinkBriefContent> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

    const inputContext = `
SELECTED CONSUMER INSIGHT:
${insight.insight_text}

SUPPORTING VERBATIMS:
${insight.verbatims.map(v => `- "${v.quote}"`).join('\n')}

TENSION TYPE: ${insight.tension_type}
JOB TO BE DONE: ${insight.jtbd}

CATEGORY CONTEXT:
${categoryContext}

RESEARCH EXCERPT:
${pruneText(researchText, 3000)}
`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `Generate a P&G Pink Brief based on this input:\n\n${inputContext}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: PINK_BRIEF_GENERATION_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            business_objective: {
              type: Type.OBJECT,
              properties: {
                to_grow: { type: Type.STRING },
                we_need_to_get: { type: Type.STRING },
                to: { type: Type.STRING },
                by_forming_new_habit: { type: Type.STRING }
              },
              required: ["to_grow", "we_need_to_get", "to", "by_forming_new_habit"]
            },
            consumer_problem: {
              type: Type.OBJECT,
              properties: {
                jtbd: { type: Type.STRING },
                current_behavior: { type: Type.STRING },
                struggle: { type: Type.STRING }
              },
              required: ["jtbd", "current_behavior", "struggle"]
            },
            communication_challenge: {
              type: Type.OBJECT,
              properties: {
                from_state: { type: Type.STRING },
                to_state: { type: Type.STRING },
                analogy_or_device: { type: Type.STRING }
              },
              required: ["from_state", "to_state", "analogy_or_device"]
            },
            message_strategy: {
              type: Type.OBJECT,
              properties: {
                benefit: { type: Type.STRING },
                rtb: { type: Type.STRING },
                brand_character: { type: Type.STRING }
              },
              required: ["benefit", "rtb", "brand_character"]
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  insight_number: { type: Type.INTEGER },
                  insight_text: { type: Type.STRING }
                },
                required: ["insight_number", "insight_text"]
              }
            },
            execution: {
              type: Type.OBJECT,
              properties: {
                key_media: { type: Type.ARRAY, items: { type: Type.STRING } },
                campaign_pillars: { type: Type.ARRAY, items: { type: Type.STRING } },
                key_considerations: { type: Type.STRING },
                success_measures: {
                  type: Type.OBJECT,
                  properties: {
                    business: { type: Type.STRING },
                    equity: { type: Type.STRING }
                  },
                  required: ["business", "equity"]
                }
              },
              required: ["key_media", "campaign_pillars", "key_considerations", "success_measures"]
            }
          },
          required: ["business_objective", "consumer_problem", "communication_challenge", "message_strategy", "insights", "execution"]
        }
      }
    });

    const content = cleanAndParseJSON(response.text);
    if (!content) throw new Error("Invalid Pink Brief response");

    return content as PinkBriefContent;
  });
};

// ============================================
// STRATEGIC SYNTHESIS (Deep Dive Module)
// ============================================

export const performStrategicSynthesis = async (research: string, insight: string) => {
  const synthesize = async (modelName: string) => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Perform P&G Strategic Synthesis.\n\nResearch:\n${pruneText(research)}\n\nSelected Insight:\n${insight}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: STRATEGIST_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            redThreadEssence: { type: Type.STRING },
            redThreadUnlock: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["id", "title", "purpose", "summary", "content"]
              }
            }
          },
          required: ["redThreadEssence", "redThreadUnlock", "sections"]
        }
      }
    });

    const parsed = cleanAndParseJSON(response.text);
    if (!parsed || !parsed.sections) throw new Error("Invalid output format");
    return parsed;
  };

  try {
    console.log("Starting synthesis with Pro model...");
    return await synthesize(PRO_MODEL);
  } catch (err) {
    console.warn("Pro model failed, falling back to Flash model...", err);
    return await synthesize(FLASH_MODEL);
  }
};
