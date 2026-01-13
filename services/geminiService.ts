
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
    throw new Error("SEC_CONFIG_MISSING: The system's cryptographic identity (API Key) is not configured. Please check environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstructions = {
    [ResearchMode.SYNTHESIS]: "Act as a Senior Research Scientist. Synthesize current scientific findings on the provided topic. Identify consensus and conflicting data.",
    [ResearchMode.LIT_REVIEW]: "Act as an Academic Librarian. Provide a structured literature review outline with key thematic clusters.",
    [ResearchMode.CRITICAL_ANALYSIS]: "Act as a Peer Reviewer. Critically evaluate methodologies and potential biases in the field.",
    [ResearchMode.HYPOTHESIS_GEN]: "Act as a Principal Investigator. Generate novel research hypotheses based on current gaps."
  };

  try {
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
      console.warn("Visual generation skipped due to secondary pipeline congestion.");
    }

    return {
      content,
      sources,
      imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (error: any) {
    console.error(`Inference Fault (Attempt ${attempt + 1}):`, error);
    
    const message = error.message?.toLowerCase() || "";
    const status = error.status || 0;

    // 1. Quota / Rate Limit Handling
    if (status === 429 || message.includes("429") || message.includes("quota") || message.includes("rate limit")) {
      if (attempt < 3) {
        const backoff = Math.pow(2, attempt) * 3000;
        await delay(backoff);
        return performResearch(query, mode, attempt + 1);
      }
      throw new Error("RATE_LIMIT: Research core is saturated with high-frequency requests. Please standby for 60 seconds.");
    }

    // 2. Authentication Errors
    if (status === 401 || status === 403 || message.includes("key") || message.includes("unauthorized")) {
      throw new Error("AUTH_FAULT: Access credentials rejected by Neural Core. Verify API configuration and project permissions.");
    }

    // 3. Network / Connectivity
    if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
      throw new Error("LINK_ERROR: Significant packet loss or network disruption detected. Check your local uplink.");
    }

    // 4. Overload / Model Unavailable
    if (status >= 500) {
      throw new Error("CORE_FAULT: Global inference engine is currently undergoing maintenance or experiencing heavy load. Retry in 10-30 seconds.");
    }
    
    throw new Error(`SYNTHESIS_ERROR: ${error.message || "A non-recoverable error occurred during data extraction."}`);
  }
};
