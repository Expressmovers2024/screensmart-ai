# AI service architecture

The AI layer is provider-based and UI-independent.

- `aiService.ts` is the app-facing service abstraction.
- `providers/` isolates concrete providers such as OpenRouter and placeholder fallback logic.
- `prompts/` owns OCR-grounded prompt construction.
- `routing/` owns model selection and fallback model rules.
- `utils/` owns context chunking and context-overflow protection.

Future OpenAI, Anthropic, Ollama, and Gemini providers should implement the same `AiProvider` contract in `types.ts`.
