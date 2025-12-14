
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Safely access process.env to prevent "ReferenceError: process is not defined" in browser
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';

// Safely initialize the client only when needed to avoid issues if key is missing during render
const getClient = () => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  text: string;
  sources: GroundingSource[];
}

export const generateProjectDetails = async (name: string, techStack: string): Promise<{ description: string; suggestedFiles: string } | null> => {
  const client = getClient();
  if (!client) return null;

  const prompt = `
    I am building a software project named "${name}" using the following technologies: "${techStack}".
    
    Please provide:
    1. A concise, professional project description (max 2 sentences).
    2. A recommended file folder structure for this type of project.
  `;

  try {
    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            suggestedFiles: { type: Type.STRING, description: "A simple text representation of a file tree structure" }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Error generating project details:", error);
    return null;
  }
};

export const fetchResourceUpdates = async (resourceName: string): Promise<SearchResult | null> => {
  const client = getClient();
  if (!client) return null;

  const prompt = `Find the latest significant news, outages, regulatory changes, or exam updates for "${resourceName}". Summarize the 3 most important recent updates in a bulleted list. If there is no major recent news, provide a general status summary.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract grounding chunks (sources)
    const sources: GroundingSource[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      });
    }

    return {
      text: response.text || "No updates found.",
      sources: sources
    };

  } catch (error) {
    console.error("Error fetching resource updates:", error);
    return null;
  }
};

export const analyzeTechStack = async (techStack: string): Promise<SearchResult | null> => {
  const client = getClient();
  if (!client) return null;

  const prompt = `Analyze this tech stack: "${techStack}". Using Google Search, identify the latest stable versions for these technologies and any major compatibility warnings or recent deprecations I should be aware of. Keep it brief (under 100 words).`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources: GroundingSource[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      });
    }

    return {
      text: response.text || "Analysis failed.",
      sources: sources
    };

  } catch (error) {
    console.error("Error analyzing tech stack:", error);
    return null;
  }
};
