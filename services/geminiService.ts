
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchMode, ResearchResponse } from "../types";

export const performResearch = async (
  query: string,
  mode: ResearchMode
): Promise<ResearchResponse> => {
  const apiKey = "AIzaSyD8v50j1uVh4n_O9lqyGaQVy-G7-AHNJF0";

  if (!apiKey) {
    throw new Error("Missing Core API Configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstructions = {
    [ResearchMode.SYNTHESIS]: "Act as a Senior Research Scientist. Synthesize current scientific findings on the provided topic. Identify consensus and conflicting data.",
    [ResearchMode.LIT_REVIEW]: "Act as an Academic Librarian. Provide a structured literature review outline with key thematic clusters.",
    [ResearchMode.CRITICAL_ANALYSIS]: "Act as a Peer Reviewer. Critically evaluate methodologies and potential biases in the field.",
    [ResearchMode.HYPOTHESIS_GEN]: "Act as a Principal Investigator. Generate novel research hypotheses based on current gaps."
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: query }] }],
      config: {
        systemInstruction: `${systemInstructions[mode]} Use professional academic tone. Provide citations where possible.`,
        tools: [{ googleSearch: {} }],
        // Keeping thinking budget within safe limits for free-tier reliability
        thinkingConfig: { thinkingBudget: 12000 }
      },
    });

    const content = response.text || "No insights could be generated for this query.";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Research Reference",
        uri: chunk.web?.uri || ""
      }));

    return {
      content,
      sources,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error: any) {
    console.error("API Error:", error);
    
    // Improved error detection for rate limits (429)
    if (error.message?.includes("429") || error.status === 429) {
      throw new Error("Neural Core is currently at capacity for free-tier users. Please pause for 60 seconds before your next synthesis.");
    }
    
    throw new Error(error.message || "An unexpected error occurred during neural synthesis.");
  }
};
