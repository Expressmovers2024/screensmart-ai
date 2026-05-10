# AI service architecture

The AI layer is provider-based and UI-independent.

- `aiService.ts` is the app-facing service abstraction.
- `providers/` isolates concrete providers such as OpenRouter and placeholder fallback logic.
- `prompts/` owns OCR-grounded prompt construction.
- `routing/` owns model selection and fallback model rules.
- `utils/` owns context chunking and context-overflow protection.

The OpenRouter provider is proxy-only in the mobile app. The Expo client sends
task, model, fallback model, and message payloads to `EXPO_PUBLIC_AI_PROXY_URL`;
the real `OPENROUTER_API_KEY` must stay in a backend or Supabase Edge Function.
When no proxy is configured, `aiService` falls back to the placeholder provider.

The Supabase Edge Function implementation lives at
`supabase/functions/ai-proxy/index.ts`. It accepts both app-generated message
payloads and higher-level OCR prompt/context payloads, calls OpenRouter
server-side, and returns normalized `content`, `model`, `usage`, and
`finishReason` fields.

Future OpenAI, Anthropic, Ollama, and Gemini providers should implement the same `AiProvider` contract in `types.ts`.
