"use server";

// --- Types matching your Python API response structure ---
interface PyPrediction {
  level?: string | null;
  confidence?: number | null;
  error?: string;
  model?: string;
  all_predictions?: unknown;
}

interface PyCoPoPrediction {
  embeddings?: number[];
  error?: string;
  model?: string;
}

interface PyCombinedResults {
  blooms?: PyPrediction;
  dave?: PyPrediction;
  coppo?: PyCoPoPrediction;
}

interface PyApiResponse {
  success: boolean;
  results?: PyCombinedResults;
}

// --- Exported Types for Client Consumption ---
export interface TaxonomyResult {
  level: string | null;
  confidence: number | null;
  error?: string;
}

export interface CoPoResult {
  embeddings?: number[];
  error?: string;
}

export interface AnalysisResponse {
  blooms: TaxonomyResult | null;
  dave: TaxonomyResult | null;
  coppo: CoPoResult | null;
  error?: string;
}

export async function analyzeText(text: string): Promise<AnalysisResponse> {
  // If your Python code has app.post('/analyze'), use this:
  const SPACE_API_URL = "https://jrine-parrot-api.hf.space/api/analyze";
  const hfToken = process.env.HF_TOKEN;

  try {
    console.log(`[Analyze Action] Sending request to ${SPACE_API_URL}...`);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (hfToken) {
      headers["Authorization"] = `Bearer ${hfToken}`;
    }

    const response = await fetch(SPACE_API_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ text }),
      cache: "no-store",
    });

    if (response.status === 503) {
      console.warn("[Analyze Action] Space is sleeping (503).");
      return {
        blooms: { level: "Sleeping", confidence: 0, error: "AI Model is waking up..." },
        dave: { level: "Sleeping", confidence: 0, error: "AI Model is waking up..." },
        coppo: null,
        error: "The AI service is currently waking up. Please try again in 60 seconds.",
      };
    }

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[Analyze Action] API Error ${response.status}: ${responseText.slice(0, 200)}...`);
      return {
        blooms: null,
        dave: null,
        coppo: null,
        error: `API Error ${response.status}: The service returned an error. Check server logs.`,
      };
    }

    const responseText = await response.text();
    let data: PyApiResponse;
    try {
      data = JSON.parse(responseText) as PyApiResponse;
    } catch (e) {
      console.error(`[Analyze Action] Failed to parse JSON: ${responseText.slice(0, 200)}`);
      return {
        blooms: null,
        dave: null,
        coppo: null,
        error: "Invalid response format. The API might have returned HTML instead of JSON.",
      };
    }

    if (data.success && data.results) {
      const mapTaxonomy = (res: PyPrediction | undefined): TaxonomyResult | null => {
        if (!res) return null;
        if (res.error) return { level: "Error", confidence: 0, error: res.error };
        return {
          level: res.level || "Unknown",
          confidence: res.confidence || 0,
        };
      };

      const mapCoPo = (res: PyCoPoPrediction | undefined): CoPoResult | null => {
        if (!res) return null;
        if (res.error) return { error: res.error };
        return { embeddings: res.embeddings };
      };

      return {
        blooms: mapTaxonomy(data.results.blooms),
        dave: mapTaxonomy(data.results.dave),
        coppo: mapCoPo(data.results.coppo),
      };
    }

    return {
      blooms: null,
      dave: null,
      coppo: null,
      error: "AI Service processed the request but returned no results.",
    };

  } catch (error: unknown) {
    console.error("[Analyze Action] Network/Code Error:", error);
    let errorMessage = "Connection failed";
    if (error instanceof Error) errorMessage = error.message;
    return {
      blooms: null,
      dave: null,
      coppo: null,
      error: errorMessage,
    };
  }
}
