
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTIONS = `
You are the P&G Deterministic Audit Analyst. 
Primary goal: REPRODUCIBILITY and LOGICAL CONSISTENCY. 
Use provided research ONLY. Headlines max 8 words.
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

const FLASH_MODEL = "gemini-3-flash-preview";
const PRO_MODEL = "gemini-3-pro-preview"; 

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
    
    // Attempt direct parse
    try { return JSON.parse(text); } catch (e) {}

    // Extract boundaries
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
      console.warn(`Attempt ${i+1} failed.`, error.message);
      if (i < maxRetries) await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError;
}

/**
 * Consolidated strategic call to minimize network hits and avoid hangs
 */
export const performStrategicSynthesis = async (research: string, insight: string) => {
  const synthesize = async (modelName: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Perform P&G Strategic Synthesis. Research: ${pruneText(research)}. Insight: ${insight}`,
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
    // Try with Pro first (Higher quality)
    console.log("Starting synthesis with Pro model...");
    return await synthesize(PRO_MODEL);
  } catch (err) {
    // Fallback to Flash immediately (Higher reliability)
    console.warn("Pro model failed, falling back to Flash model...", err);
    return await synthesize(FLASH_MODEL);
  }
};

export const extractRankedInsights = async (text: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Extract insights from: ${pruneText(text)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  insight: { type: Type.STRING },
                  plainEnglishExplanation: { type: Type.STRING },
                  rank: { type: Type.INTEGER },
                  reasoning: { type: Type.STRING },
                  totalEvidenceFrequency: { type: Type.STRING },
                  mentions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { text: { type: Type.STRING }, relevanceScore: { type: Type.NUMBER } },
                      required: ["text", "relevanceScore"]
                    }
                  },
                  matchPercentage: { type: Type.NUMBER }
                },
                required: ["insight", "plainEnglishExplanation", "rank", "reasoning", "mentions", "matchPercentage", "totalEvidenceFrequency"]
              }
            }
          },
          required: ["insights"]
        }
      }
    });
    
    const content = cleanAndParseJSON(response.text);
    if (!content || !content.insights) throw new Error("Invalid insights response");
    
    return {
      insights: content.insights.map((ins: any) => ({
        ...ins,
        mentionCount: (ins.mentions || []).length,
        verbatims: (ins.mentions || []).map((m: any) => m.text)
      }))
    };
  });
};

export const testBespokeInsight = async (text: string, userInsight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Audit hypothesis: "${userInsight}" against research: ${pruneText(text)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            plainEnglishExplanation: { type: Type.STRING },
            totalEvidenceFrequency: { type: Type.STRING },
            mentions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { text: { type: Type.STRING }, relevanceScore: { type: Type.NUMBER } },
                required: ["text", "relevanceScore"]
              }
            },
            matchPercentage: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["insight", "plainEnglishExplanation", "mentions", "matchPercentage", "reasoning", "totalEvidenceFrequency"]
        }
      }
    });
    const content = cleanAndParseJSON(response.text);
    if (!content) throw new Error("Invalid audit response");
    return {
      ...content,
      mentionCount: (content.mentions || []).length,
      verbatims: (content.mentions || []).map((m: any) => m.text)
    };
  });
};

export const generatePinkBrief = async (data: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `P&G Pink Brief: ${JSON.stringify(data)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            locationBrandProject: { type: Type.STRING },
            toGrow: { type: Type.STRING },
            needToPrevent: { type: Type.STRING },
            andObjective: { type: Type.STRING },
            byForming: { type: Type.STRING },
            jtbd: { type: Type.STRING },
            consumerCurrently: { type: Type.STRING },
            struggleWith: { type: Type.STRING },
            commChallenge: { type: Type.STRING },
            benefit: { type: Type.STRING },
            rtb: { type: Type.STRING },
            brandCharacter: { type: Type.STRING },
            insight1: { type: Type.STRING },
            insight2: { type: Type.STRING },
            keyMedia: { type: Type.STRING },
            budget: { type: Type.STRING },
            inMarketDate: { type: Type.STRING },
            successMeasuresBusiness: { type: Type.STRING },
            successMeasuresEquity: { type: Type.STRING },
            deliverables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  touchpoint: { type: Type.STRING },
                  messages: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["touchpoint", "messages"]
              }
            }
          },
          required: ["locationBrandProject", "toGrow", "needToPrevent", "andObjective", "byForming", "jtbd", "consumerCurrently", "struggleWith", "commChallenge", "benefit", "rtb", "brandCharacter", "insight1", "insight2", "keyMedia", "budget", "inMarketDate", "successMeasuresBusiness", "successMeasuresEquity", "deliverables"]
        }
      }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const analyzeResearch = async (research: string, insight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Analyze: ${pruneText(research, 3000)} - Insight: ${insight}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["keyInsights", "summary"]
        }
      }
    });
    return cleanAndParseJSON(response.text) || { keyInsights: [], summary: "" };
  });
};

export const generatePersona = async (research: string, insight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Persona for: ${pruneText(research, 3000)} - Insight: ${insight}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            demographics: { type: Type.STRING },
            psychographics: { type: Type.STRING },
            keyNeed: { type: Type.STRING }
          },
          required: ["name", "demographics", "psychographics", "keyNeed"]
        }
      }
    });
    return cleanAndParseJSON(response.text);
  });
};

export const suggestCreativeDirections = async (data: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Directions for: ${JSON.stringify(data)}`,
      config: {
        ...DETERMINISTIC_CONFIG,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              directionName: { type: Type.STRING },
              message: { type: Type.STRING },
              tone: { type: Type.STRING }
            },
            required: ["directionName", "message", "tone"]
          }
        }
      }
    });
    return cleanAndParseJSON(response.text) || [];
  });
};
