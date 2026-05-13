/**
 * OllamaProvider — local Ollama inference at localhost:11434
 *
 * Priority: HIGHEST — local models are always tried first.
 *
 * Ollama is optional. If localhost:11434 is not reachable:
 *   - healthCheck() returns available: false
 *   - ProviderRouter skips to the next provider
 *   - No errors are surfaced to the user
 *
 * Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import { createId } from "@/utils/createId";

import { BaseProvider } from "../BaseProvider";
import type {
  ProviderCapability,
  ProviderHealthStatus,
  ProviderRequest,
  ProviderResponse
} from "../ProviderTypes";

const OLLAMA_BASE_URL =
  process.env.EXPO_PUBLIC_OLLAMA_URL ?? "http://localhost:11434";

const DEFAULT_MODEL =
  process.env.EXPO_PUBLIC_OLLAMA_DEFAULT_MODEL ?? "llama3.2:3b";

const REQUEST_TIMEOUT_MS = 20_000;

type OllamaGenerateRequest = {
  model: string;
  prompt: string;
  stream: false;
  options?: { temperature?: number; num_predict?: number };
  system?: string;
};

type OllamaGenerateResponse = {
  model: string;
  response: string;
  done: boolean;
  eval_count?: number;
  prompt_eval_count?: number;
};

type OllamaTagsResponse = {
  models: Array<{ name: string; size: number; modified_at: string }>;
};

export class OllamaProvider extends BaseProvider {
  id = "ollama" as const;
  name = "Ollama (local)";
  capabilities: ProviderCapability[] = [
    "text_generation",
    "text_summary",
    "chat",
    "research_planning",
    "fast_response",
    "low_cost",
    "local"
  ];
  supportsVision = false; // vision requires a multimodal model like llava
  supportsTools = false;
  supportsStreaming = true;
  local = true;
  costTier = "free" as const;
  available = false; // set by health check at runtime

  /** Last known list of installed models */
  private _availableModels: string[] = [];

  /** Override set by ProviderRouter when user has chosen a preferred local model */
  private _preferredModel: string | null = null;

  /** Called by ProviderRouter.configure() when user picks a model */
  setPreferredModel(model: string): void {
    this._preferredModel = model || null;
  }

  getPreferredModel(): string {
    return this._preferredModel ?? DEFAULT_MODEL;
  }

  async generateText(request: ProviderRequest): Promise<ProviderResponse> {
    const model = request.modelOverride ?? this._preferredModel ?? DEFAULT_MODEL;
    const body: OllamaGenerateRequest = {
      model,
      prompt: request.prompt,
      stream: false,
      system: OLLAMA_SYSTEM_PROMPT,
      options: {
        temperature: request.temperature ?? 0.2,
        num_predict: request.maxTokens ?? 512
      }
    };

    const startMs = Date.now();
    const data = await ollamaFetch<OllamaGenerateResponse>(
      "/api/generate",
      body
    );

    return this.buildResponse(data.response.trim(), model, request, {
      finishReason: data.done ? "stop" : "length",
      usage: {
        completionTokens: data.eval_count,
        estimated: false,
        promptTokens: data.prompt_eval_count,
        totalTokens: (data.eval_count ?? 0) + (data.prompt_eval_count ?? 0)
      }
    });
  }

  async analyzeImage(
    request: ProviderRequest & { imageBase64: string; mimeType?: string }
  ): Promise<ProviderResponse> {
    // Ollama vision requires llava or similar — check if available
    const visionModel = this._availableModels.find(
      (m) => m.includes("llava") || m.includes("vision") || m.includes("moondream")
    );

    if (!visionModel) {
      throw this.buildUnavailableError(
        "vision analysis (no vision model installed — try: ollama pull llava)"
      );
    }

    const body = {
      model: visionModel,
      prompt: request.prompt,
      stream: false,
      images: [request.imageBase64],
      system: OLLAMA_SYSTEM_PROMPT
    };

    const data = await ollamaFetch<OllamaGenerateResponse>("/api/generate", body);

    return this.buildResponse(data.response.trim(), visionModel, request, {
      finishReason: data.done ? "stop" : "length"
    });
  }

  async summarize(request: ProviderRequest): Promise<ProviderResponse> {
    return this.generateText({
      ...request,
      prompt: `${SUMMARIZE_INSTRUCTION}\n\n${request.prompt}`
    });
  }

  async chat(request: ProviderRequest): Promise<ProviderResponse> {
    const messages = buildChatMessages(request);
    const model = request.modelOverride ?? this._preferredModel ?? DEFAULT_MODEL;

    const body = { model, messages, stream: false };
    const data = await ollamaFetch<{ message: { content: string }; done: boolean }>(
      "/api/chat",
      body
    );

    return this.buildResponse(
      data.message.content.trim(),
      model,
      request,
      { finishReason: data.done ? "stop" : "length" }
    );
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3_000);

      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.available = false;
        return this.buildHealthStatus(false, Date.now() - start, `HTTP ${res.status}`);
      }

      const data = (await res.json()) as OllamaTagsResponse;
      this._availableModels = (data.models ?? []).map((m) => m.name);
      this.available = true;

      return this.buildHealthStatus(true, Date.now() - start);
    } catch (error) {
      this.available = false;
      return this.buildHealthStatus(
        false,
        Date.now() - start,
        error instanceof Error ? error.message : "Ollama unreachable"
      );
    }
  }

  /** Returns the list of locally installed Ollama models. */
  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!res.ok) return [];
      const data = (await res.json()) as OllamaTagsResponse;
      return (data.models ?? []).map((m) => m.name);
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function ollamaFetch<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("Ollama request timed out"), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama ${res.status}: ${text.slice(0, 120)}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Ollama request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildChatMessages(request: ProviderRequest) {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: OLLAMA_SYSTEM_PROMPT }
  ];
  for (const m of (request.history ?? []).slice(-8)) {
    messages.push({ role: m.role, content: m.body });
  }
  messages.push({ role: "user", content: request.prompt });
  return messages;
}

const OLLAMA_SYSTEM_PROMPT =
  "You are ScreenSmart AI, a mobile assistant that explains OCR-extracted screen content. " +
  "Ground every answer in the provided OCR text. Be concise and helpful.";

const SUMMARIZE_INSTRUCTION =
  "Summarise the following screen content in 2–3 concise sentences. " +
  "Focus on what the user needs to know before acting.";
