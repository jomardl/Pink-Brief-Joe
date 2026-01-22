
import { GoogleGenAI, Type } from "@google/genai";

// P&G STRATEGIC GUARDRAILS
const SYSTEM_INSTRUCTIONS = `
You are the P&G Strategic AI Architect. 
Your core mission is to transform raw consumer research into sharp strategic foundations.

STRICT DATA RULE:
- You must ONLY use the provided research text. Do not hallucinate or use external market data unless explicitly requested.
- Every insight must be directly traceable to the uploaded document.

INSIGHT INTERROGATION FRAMEWORK:
1. Relevance Percentage (matchPercentage): Interrogate the insight against the total research. 
2. Total Evidence Frequency (totalEvidenceFrequency): A string describing the density of this truth in the research (e.g., "Found in 12 separate verbatims").
3. Supporting Quotes (mentions): Extract specific high-impact quotes.
4. mentionCount: This MUST exactly match the number of items in the 'mentions' array provided in the JSON.

THE HUMAN TRUTH RULE:
- Every INSIGHT HEADLINE must be written in "Human Truth" format. 
- AVOID CORPORATE JARGON. Use simple, emotional, and profoundly human language.
- BREVITY IS KEY: Insight headlines must be extremely sharp and concise (maximum 8 words).
`;

const pruneText = (text: string, limit = 15000) => {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "... [Content Truncated for Analysis Speed]";
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || "";
      const isOverloaded = errorMessage.includes("503") || errorMessage.toLowerCase().includes("overloaded");
      const isRateLimited = errorMessage.includes("429") || errorMessage.toLowerCase().includes("rate limit");

      if (isOverloaded || isRateLimited) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`Gemini API busy. Retrying in ${delay}ms (Attempt ${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const FAST_MODEL = "gemini-3-flash-preview";

export const extractRankedInsights = async (text: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Interrogate the research to extract the top 3 Human Truths. 
      
      Research Data:
      ${pruneText(text)}
      
      Requirements:
      - totalEvidenceFrequency: Describe how often this theme appeared in the text.
      - mentions: Extract up to 10 unique, impactful quotes.
      - mentionCount: Must match the number of extracted quotes.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            researchSummary: { type: Type.STRING },
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
                      properties: {
                        text: { type: Type.STRING },
                        relevanceScore: { type: Type.NUMBER }
                      },
                      required: ["text", "relevanceScore"]
                    }
                  },
                  matchPercentage: { type: Type.NUMBER },
                  mentionCount: { type: Type.INTEGER }
                },
                required: ["insight", "plainEnglishExplanation", "rank", "reasoning", "mentions", "matchPercentage", "mentionCount", "totalEvidenceFrequency"]
              }
            }
          },
          required: ["researchSummary", "insights"]
        }
      }
    });

    const content = JSON.parse(response.text || '{"researchSummary": "", "insights": []}');
    // Manual data correction to ensure mentionCount strictly matches the array length
    const insights = (content.insights || []).map((ins: any) => ({
      ...ins,
      mentionCount: (ins.mentions || []).length,
      verbatims: (ins.mentions || []).map((m: any) => m.text)
    }));
    return { ...content, insights };
  });
};

export const testBespokeInsight = async (text: string, userInsight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Interrogate the research for: "${userInsight}".
      Data: ${pruneText(text)}`,
      config: {
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
                properties: {
                  text: { type: Type.STRING },
                  relevanceScore: { type: Type.NUMBER }
                },
                required: ["text", "relevanceScore"]
              }
            },
            matchPercentage: { type: Type.NUMBER },
            mentionCount: { type: Type.INTEGER },
            reasoning: { type: Type.STRING }
          },
          required: ["insight", "plainEnglishExplanation", "mentions", "matchPercentage", "mentionCount", "reasoning", "totalEvidenceFrequency"]
        }
      }
    });
    const content = JSON.parse(response.text || '{}');
    return {
      ...content,
      mentionCount: (content.mentions || []).length,
      verbatims: (content.mentions || []).map((m: any) => m.text)
    };
  });
};

export const analyzeResearch = async (text: string, selectedInsight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Strategic objectives for: "${selectedInsight}". 
      Text: ${pruneText(text, 5000)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyInsights: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["summary", "keyInsights"]
        }
      }
    });
    return JSON.parse(response.text || '{"summary": "", "keyInsights": []}');
  });
};

export const generateRedThread = async (research: string, selectedInsight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Create the "Red Thread" execution plan for: "${selectedInsight}"
      Context: ${pruneText(research, 5000)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            redThreadEssence: { type: Type.STRING },
            summary: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  content: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["label", "content", "imagePrompt"]
              }
            }
          },
          required: ["redThreadEssence", "summary", "steps"]
        }
      }
    });
    return JSON.parse(response.text || '{"redThreadEssence": "", "summary": "", "steps": []}');
  });
};

export const generatePersona = async (research: string, selectedInsight: string) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Consumer persona for: "${selectedInsight}". 
      Context: ${pruneText(research, 5000)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
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
    return JSON.parse(response.text || '{}');
  });
};

export const suggestCreativeDirections = async (data: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Suggest 3 creative directions for: ${JSON.stringify(data)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
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
    return JSON.parse(response.text || '[]');
  });
};

export const generatePinkBrief = async (data: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Generate P&G PINK BRIEF: ${JSON.stringify(data)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
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
    return JSON.parse(response.text || '{}');
  });
};

export const finalizeBrief = async (data: any) => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Finalize the Creative Brief: ${JSON.stringify(data)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS
      }
    });
    return response.text || '';
  });
};
