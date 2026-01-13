
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchMode, ResearchResponse } from "../types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const performResearch = async (
  query: string,
  mode: ResearchMode,
  attempt: number = 0
): Promise<ResearchResponse> => {
  const apiKey = process.env.API_KEY;

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
    // 1. Generate textual research content
    const textResponse: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: query }] }],
      config: {
        systemInstruction: `${systemInstructions[mode]} Use professional academic tone. Provide citations where possible.`,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 10000 }
      },
    });

    const content = textResponse.text || "No insights could be generated for this query.";
    
    const groundingChunks = textResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Research Reference",
        uri: chunk.web?.uri || ""
      }));

    // 2. Generate a contextual image for the research
    let imageUrl: string | undefined;
    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A clean, professional academic illustration or conceptual diagram representing: ${query}. Minimalist, scientific, blue and white color palette, 4k, high resolution, no text.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          },
        },
      });

      for (const part of imgResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (imgError) {
      console.warn("Image generation failed, skipping visual supplement.", imgError);
    }

    return {
      content,
      sources,
      imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error: any) {
    console.error(`API Error (Attempt ${attempt + 1}):`, error);
    
    const isRateLimit = error.message?.includes("429") || error.status === 429;
    
    if (isRateLimit && attempt < 2) {
      const waitTime = Math.pow(2, attempt) * 2000;
      await delay(waitTime);
      return performResearch(query, mode, attempt + 1);
    }
    
    if (isRateLimit) {
      throw new Error("Neural Core is at maximum capacity. Please wait 60 seconds for the quota to reset.");
    }
    
    throw new Error(error.message || "An unexpected error occurred during neural synthesis.");
  }
};
