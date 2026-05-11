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
    message?: {
      content?: string;
    };
  }>;
  model?: string;
  usage?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat-v3.1:free";
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_FALLBACK_MODELS = 3;
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

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-screensmart-app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Vary": "Origin"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

  if (!openRouterApiKey) {
    return jsonResponse({ error: "OPENROUTER_API_KEY is not configured" }, 500);
  }

  let body: AiProxyRequest;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400);
  }

  const modelQueue = getModelQueue(body);
  const messages = buildMessages(body);
  const imageDataUrl = getImageDataUrl(body);

  if (messages.length === 0) {
    return jsonResponse({ error: "AI request requires prompt, OCR text/context, chat history, or messages" }, 400);
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

      return jsonResponse(normalized, 200);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "OpenRouter request failed";
    }
  }

  return jsonResponse({ error: lastError }, lastError.includes("timed out") ? 504 : 502);
});

async function callOpenRouter(input: {
  apiKey: string;
  imageDataUrl?: string;
  messages: ChatMessage[];
  model: string;
  temperature: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("OpenRouter request timed out"), REQUEST_TIMEOUT_MS);

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

function getModelQueue(body: AiProxyRequest) {
  const primaryModel = body.preferredModel || body.model || Deno.env.get("OPENROUTER_DEFAULT_MODEL") || DEFAULT_MODEL;
  const hasImage = Boolean(getImageDataUrl(body));
  const fallbackModels = [primaryModel, ...(body.fallbackModels ?? [])]
    .filter((model) => typeof model === "string" && isAllowedFreeModel(model.trim(), hasImage))
    .slice(0, MAX_FALLBACK_MODELS);

  return Array.from(
    new Set(fallbackModels.length > 0 ? fallbackModels : [hasImage ? "google/gemini-2.0-flash-exp:free" : DEFAULT_MODEL])
  );
}

function buildMessages(body: AiProxyRequest): ChatMessage[] {
  if (body.messages?.length) {
    return body.messages
      .filter((message) => isSupportedRole(message.role) && Boolean(getMessageContent(message)))
      .map((message) => ({
        content: getMessageContent(message),
        role: message.role
      }));
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
  const history = body.chatHistory ?? body.history ?? [];

  for (const message of history.slice(-8)) {
    if (!isSupportedRole(message.role) || message.role === "system") {
      continue;
    }

    const content = getMessageContent(message);

    if (content) {
      messages.push({ content, role: message.role });
    }
  }

  const prompt = buildPrompt(body);

  if (prompt) {
    messages.push({ content: prompt, role: "user" });
  }

  return messages;
}

function buildPrompt(body: AiProxyRequest) {
  const contextText = body.context?.extractedText ?? body.ocrText;
  const contextLines = [
    body.context?.sessionId ? `OCR session: ${body.context.sessionId}` : undefined,
    body.context?.category ? `Detected category: ${body.context.category}` : undefined,
    typeof body.context?.confidence === "number" ? `OCR confidence: ${Math.round(body.context.confidence * 100)}%` : undefined,
    contextText ? `OCR text:\n${contextText}` : undefined,
    body.prompt
  ].filter(Boolean);

  return contextLines.join("\n\n").trim();
}

function normalizeOpenRouterResponse(response: OpenRouterResponse, requestedModel: string, task?: string) {
  const content = response.choices?.[0]?.message?.content?.trim() ?? "";

  return {
    content,
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

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}

function getMessageContent(message: ChatMessage) {
  return (message.content ?? message.body ?? "").trim();
}

function isSupportedRole(role: string): role is ChatRole {
  return role === "system" || role === "user" || role === "assistant";
}

function normalizeTemperature(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0.2;
  }

  return Math.max(0, Math.min(1, value));
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

function isAllowedFreeModel(model: string, requiresVision = false) {
  if (!ALLOWED_FREE_OPENROUTER_MODELS.has(model) && !model.endsWith(":free")) {
    return false;
  }

  return requiresVision ? ALLOWED_FREE_VISION_MODELS.has(model) : true;
}

function getImageDataUrl(body: AiProxyRequest) {
  const dataUrl = body.image?.dataUrl;

  if (dataUrl?.startsWith("data:image/")) {
    return dataUrl;
  }

  const base64 = body.imageBase64 ?? body.image?.base64;

  if (!base64) {
    return undefined;
  }

  const mimeType = body.imageMimeType ?? body.image?.mimeType ?? "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

function buildOpenRouterMessages(messages: ChatMessage[], imageDataUrl?: string) {
  return messages.map((message, index) => {
    const content = message.content ?? message.body ?? "";
    const isLastUserMessage = imageDataUrl && message.role === "user" && index === messages.length - 1;

    if (!isLastUserMessage) {
      return {
        content,
        role: message.role
      };
    }

    return {
      role: message.role,
      content: [
        {
          text: content,
          type: "text"
        },
        {
          image_url: {
            url: imageDataUrl
          },
          type: "image_url"
        }
      ]
    };
  });
}
