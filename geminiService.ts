
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTIONS = `
You are the P&G Deterministic Audit Analyst. 
Primary goal: REPRODUCIBILITY and LOGICAL CONSISTENCY. 
Use provided research ONLY. Headlines max 8 words.
`;

const STRATEGIST_INSTRUCTIONS = `
You are a Senior Brand Strategist at P&G. Synthesize research into a deep strategic narrative. 
OUTPUT MUST BE VALID JSON. No conversational filler. No thinking blocks.

STRUCTURE:
- redThreadEssence: A 2-4 word core brand essence.
- redThreadUnlock: A powerful 1-sentence strategic unlock.
- sections: Array of 5 objects (id, title, purpose, summary, content).

SECTIONS TO GENERATE:
1. Business Landscape & Competitive Reality
2. Behavioral Deep-Dive
3. Strategic Tension & "The Unlock"
4. The Brand's Right to Win
5. Creative & Cultural Direction
`;

const FLASH_MODEL = "gemini-3-flash-preview";
const PRO_MODEL = "gemini-3-pro-preview"; 

const DETERMINISTIC_CONFIG = {
  temperature: 0.1,
  seed: 42,      
};

/**
 * Aggressive pruning to prevent "Model Choke"
 */
const pruneText = (text: string, limit = 4000) => {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length <= limit ? cleaned : cleaned.substring(0, limit) + "...";
};

/**
 * Robust JSON extraction that survives "Thinking" tokens and conversational noise
 */
const cleanAndParseJSON = (text: string) => {
  if (!text) return null;
  
  try {
    // 1. Remove obvious markdown
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 2. Strip <thinking> tags if present
    cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");

    // 3. Find the first '{' or '[' and the last '}' or ']'
    const startChar = cleaned.indexOf('{');
    const endChar = cleaned.lastIndexOf('}');
    
    if (startChar !== -1 && endChar !== -1 && endChar > startChar) {
      const jsonCandidate = cleaned.substring(startChar, endChar + 1);
      return JSON.parse(jsonCandidate);
    }

    // 4. Fallback to standard parse if boundaries aren't clear
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Advanced JSON Recovery failed. Text fragment:", text.substring(0, 100));
    return null;
  }
};

/**
 * High-Reliability Synthesis Engine
 */
export const performStrategicSynthesis = async (research: string, insight: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const attemptSynthesis = async (model: string, charLimit: number, timeout?: number) => {
    const prompt = `
      RESEARCH: ${pruneText(research, charLimit)}
      HUMAN TRUTH: ${insight}
      Generate the full P&G Strategic Narrative.
    `;

    const config = {
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
    };

    const task = ai.models.generateContent({ model, contents: prompt, config });

    if (timeout) {
      return Promise.race([
        task,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), timeout))
      ]);
    }
    return task;
  };

  try {
    // STEP 1: Attempt Pro with 15s "Patience" window
    console.log("Tier 1 Execution: Pro Model...");
    const response: any = await attemptSynthesis(PRO_MODEL, 3500, 15000);
    const result = cleanAndParseJSON(response.text);
    if (result) return result;
    throw new Error("EMPTY_PARSED_RESULT");
  } catch (err: any) {
    // STEP 2: Fallback to Flash immediately on any failure or timeout
    console.warn(`Tier 1 failed (${err.message}). Activating Tier 2: Flash Recovery...`);
    const response: any = await attemptSynthesis(FLASH_MODEL, 2500);
    const result = cleanAndParseJSON(response.text);
    if (!result) throw new Error("CRITICAL_SYNTHESIS_FAILURE");
    return result;
  }
};

export const extractRankedInsights = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Extract ranked insights from: ${pruneText(text, 5000)}`,
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
  if (!content?.insights) throw new Error("INSIGHT_EXTRACTION_FAILED");
  
  return {
    insights: content.insights.map((ins: any) => ({
      ...ins,
      mentionCount: (ins.mentions || []).length,
      verbatims: (ins.mentions || []).map((m: any) => m.text)
    }))
  };
};

export const testBespokeInsight = async (text: string, userInsight: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Audit hypothesis: "${userInsight}" against research: ${pruneText(text, 3000)}`,
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
  if (!content) throw new Error("AUDIT_FAILED");
  return {
    ...content,
    mentionCount: (content.mentions || []).length,
    verbatims: (content.mentions || []).map((m: any) => m.text)
  };
};

export const generatePinkBrief = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Finalize P&G Pink Brief from data: ${JSON.stringify(data)}`,
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
};

export const analyzeResearch = async (research: string, insight: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Analyze: ${pruneText(research, 3000)} for truth: ${insight}`,
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
};

export const generatePersona = async (research: string, insight: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Target Persona for research: ${pruneText(research, 3000)} - Insight: ${insight}`,
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
};

export const suggestCreativeDirections = async (data: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Creative Hooks for: ${JSON.stringify(data)}`,
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
};
