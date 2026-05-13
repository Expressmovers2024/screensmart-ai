/**
 * ScreenSmart AI — ai-proxy Edge Function
 *
 * Security hardening (v2):
 *   - JWT validation via Supabase Auth before any AI call
 *   - Scoped CORS (APP_ALLOWED_ORIGINS env var, falls back to localhost dev origins)
 *   - Free-model-only allowlist (mirrors constants/freeModels.ts — keep in sync)
 *   - Per-request timeout + fallback model queue
 *   - No user data logged
 *
 * Environment variables required:
 *   OPENROUTER_API_KEY      — OpenRouter API key
 *   SUPABASE_URL            — auto-set by Supabase Edge runtime
 *   SUPABASE_ANON_KEY       — auto-set by Supabase Edge runtime
 *   APP_URL                 — your app's public URL (used as HTTP-Referer)
 *   APP_ALLOWED_ORIGINS     — comma-separated list of allowed CORS origins
 *                             e.g. "https://screensmart.ai,exp://192.168.1.10:8081"
 *                             Defaults to Expo dev origins when not set.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content?: string;
  body?: string;
};

type ImageInput = {
  base64?: string;
  dataUrl?: string;
  mimeType?: string;
};

type OcrContext = {
  sessionId?: string;
  extractedText?: string;
  confidence?: number;
  category?: string;
};

type AiProxyRequest = {
  task?: string;
  prompt?: string;
  context?: OcrContext;
  ocrText?: string;
  chatHistory?: ChatMessage[];
  history?: ChatMessage[];
  messages?: ChatMessage[];
  image?: ImageInput;
  imageBase64?: string;
  imageMimeType?: string;
  model?: string;
  preferredModel?: string;
  fallbackModels?: string[];
  temperature?: number;
};

type OpenRouterResponse = {
  id?: string;
  choices?: Array<{
    finish_reason?: string;
    message?: { content?: string };
  }>;
  model?: string;
  usage?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

// ---------------------------------------------------------------------------
// Constants — mirrors constants/freeModels.ts. Keep in sync.
// ---------------------------------------------------------------------------

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat-v3.1:free";
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_FALLBACK_MODELS = 3;

/**
 * Allowed free OpenRouter model IDs.
 * MUST stay in sync with constants/freeModels.ts FREE_OPENROUTER_MODELS.
 */
const ALLOWED_FREE_OPENROUTER_MODELS = new Set([
  "deepseek/deepseek-chat-v3.1:free",
  "qwen/qwen3-235b-a22b:free",
  "google/gemini-2.0-flash-exp:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen2.5-vl-72b-instruct:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free"
]);

const ALLOWED_FREE_VISION_MODELS = new Set([
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen2.5-vl-72b-instruct:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free"
]);

// ---------------------------------------------------------------------------
// CORS — scoped to configured origins
// ---------------------------------------------------------------------------

function getAllowedOrigins(): string[] {
  const configured = Deno.env.get("APP_ALLOWED_ORIGINS");
  if (configured) {
    return configured.split(",").map((o) => o.trim()).filter(Boolean);
  }
  // Development fallback — Expo Go + web
  return ["http://localhost:8081", "http://localhost:19006", "exp://localhost:8081"];
}

function buildCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const origin =
    requestOrigin && allowed.includes(requestOrigin) ? requestOrigin : allowed[0] ?? "*";

  return {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-screensmart-app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin"
  };
}

// ---------------------------------------------------------------------------
// JWT validation
// ---------------------------------------------------------------------------

async function validateJwt(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    // Edge runtime not fully configured — allow in local dev only
    const isDev = Deno.env.get("SUPABASE_ENV") === "local";
    return isDev;
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data, error } = await client.auth.getUser(token);
    return !error && Boolean(data.user);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  // JWT gate — every non-OPTIONS request must carry a valid Supabase session
  const isAuthenticated = await validateJwt(request.headers.get("authorization"));
  if (!isAuthenticated) {
    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
  }

  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!openRouterApiKey) {
    return jsonResponse({ error: "OPENROUTER_API_KEY is not configured" }, 500, corsHeaders);
  }

  let body: AiProxyRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400, corsHeaders);
  }

  const modelQueue = getModelQueue(body);
  const messages = buildMessages(body);
  const imageDataUrl = getImageDataUrl(body);

  if (messages.length === 0) {
    return jsonResponse(
      { error: "AI request requires prompt, OCR text/context, chat history, or messages" },
      400,
      corsHeaders
    );
  }

  const temperature = normalizeTemperature(body.temperature);
  let lastError = "OpenRouter request failed";

  for (const model of modelQueue) {
    try {
      const openRouterResponse = await callOpenRouter({
        apiKey: openRouterApiKey,
        imageDataUrl,
        messages,
        model,
        temperature
      });
      const normalized = normalizeOpenRouterResponse(openRouterResponse, model, body.task);

      if (!normalized.content) {
        lastError = `OpenRouter returned an empty response for ${model}`;
        continue;
      }

      return jsonResponse(normalized, 200, corsHeaders);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "OpenRouter request failed";
    }
  }

  return jsonResponse(
    { error: lastError },
    lastError.includes("timed out") ? 504 : 502,
    corsHeaders
  );
});

// ---------------------------------------------------------------------------
// OpenRouter call
// ---------------------------------------------------------------------------

async function callOpenRouter(input: {
  apiKey: string;
  imageDataUrl?: string;
  messages: ChatMessage[];
  model: string;
  temperature: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort("OpenRouter request timed out"),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(OPENROUTER_URL, {
      body: JSON.stringify({
        messages: buildOpenRouterMessages(input.messages, input.imageDataUrl),
        model: input.model,
        temperature: input.temperature
      }),
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("APP_URL") ?? "https://screensmart.ai",
        "X-Title": "ScreenSmart AI"
      },
      method: "POST",
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter ${response.status}: ${truncate(errorText, 240)}`);
    }

    return (await response.json()) as OpenRouterResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("OpenRouter request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Message construction
// ---------------------------------------------------------------------------

function getModelQueue(body: AiProxyRequest): string[] {
  const primaryModel =
    body.preferredModel ||
    body.model ||
    Deno.env.get("OPENROUTER_DEFAULT_MODEL") ||
    DEFAULT_MODEL;
  const hasImage = Boolean(getImageDataUrl(body));
  const candidates = [primaryModel, ...(body.fallbackModels ?? [])]
    .filter((m) => typeof m === "string" && isAllowedFreeModel(m.trim(), hasImage))
    .slice(0, MAX_FALLBACK_MODELS);

  return Array.from(
    new Set(
      candidates.length > 0
        ? candidates
        : [hasImage ? "google/gemini-2.0-flash-exp:free" : DEFAULT_MODEL]
    )
  );
}

function buildMessages(body: AiProxyRequest): ChatMessage[] {
  if (body.messages?.length) {
    return body.messages
      .filter((m) => isSupportedRole(m.role) && Boolean(getMessageContent(m)))
      .map((m) => ({ content: getMessageContent(m), role: m.role }));
  }

  const messages: ChatMessage[] = [
    {
      content: [
        "You are ScreenSmart AI, a mobile-first assistant that explains OCR-extracted screen content.",
        "Ground every answer in the provided OCR text.",
        "Use clear, concise language.",
        "If the OCR text is incomplete, say what is uncertain.",
        "Do not invent facts that are not visible in the OCR context."
      ].join("\n"),
      role: "system"
    }
  ];

  for (const m of (body.chatHistory ?? body.history ?? []).slice(-8)) {
    if (!isSupportedRole(m.role) || m.role === "system") continue;
    const content = getMessageContent(m);
    if (content) messages.push({ content, role: m.role });
  }

  const prompt = buildPrompt(body);
  if (prompt) messages.push({ content: prompt, role: "user" });

  return messages;
}

function buildPrompt(body: AiProxyRequest): string {
  const contextText = body.context?.extractedText ?? body.ocrText;
  return [
    body.context?.sessionId ? `OCR session: ${body.context.sessionId}` : undefined,
    body.context?.category ? `Detected category: ${body.context.category}` : undefined,
    typeof body.context?.confidence === "number"
      ? `OCR confidence: ${Math.round(body.context.confidence * 100)}%`
      : undefined,
    contextText ? `OCR text:\n${contextText}` : undefined,
    body.prompt
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function buildOpenRouterMessages(messages: ChatMessage[], imageDataUrl?: string) {
  return messages.map((m, index) => {
    const content = m.content ?? m.body ?? "";
    const isLastUser = imageDataUrl && m.role === "user" && index === messages.length - 1;
    if (!isLastUser) return { content, role: m.role };
    return {
      role: m.role,
      content: [
        { text: content, type: "text" },
        { image_url: { url: imageDataUrl }, type: "image_url" }
      ]
    };
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function normalizeOpenRouterResponse(
  response: OpenRouterResponse,
  requestedModel: string,
  task?: string
) {
  return {
    content: response.choices?.[0]?.message?.content?.trim() ?? "",
    finishReason: response.choices?.[0]?.finish_reason,
    id: response.id ?? crypto.randomUUID(),
    model: response.model ?? requestedModel,
    task,
    usage: {
      completionTokens: response.usage?.completion_tokens,
      promptTokens: response.usage?.prompt_tokens,
      totalTokens: response.usage?.total_tokens
    }
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>
) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status
  });
}

function getMessageContent(m: ChatMessage): string {
  return (m.content ?? m.body ?? "").trim();
}

function isSupportedRole(role: string): role is ChatRole {
  return role === "system" || role === "user" || role === "assistant";
}

function normalizeTemperature(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.2;
  return Math.max(0, Math.min(1, value));
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

function isAllowedFreeModel(model: string, requiresVision = false): boolean {
  if (!ALLOWED_FREE_OPENROUTER_MODELS.has(model) && !model.endsWith(":free")) return false;
  return requiresVision ? ALLOWED_FREE_VISION_MODELS.has(model) : true;
}

function getImageDataUrl(body: AiProxyRequest): string | undefined {
  const dataUrl = body.image?.dataUrl;
  if (dataUrl?.startsWith("data:image/")) return dataUrl;
  const base64 = body.imageBase64 ?? body.image?.base64;
  if (!base64) return undefined;
  const mimeType = body.imageMimeType ?? body.image?.mimeType ?? "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}
