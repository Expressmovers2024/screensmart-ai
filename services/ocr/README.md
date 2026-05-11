# OCR service architecture

The OCR layer is provider-based and UI-independent.

- `ocrService.ts` is the app-facing OCR abstraction.
- `providers/` isolates ML Kit, placeholder, and future OCR providers.
- `types.ts` defines structured text blocks, lines, progress events, and provider contracts.

For Expo Go MVP testing, `ocrService.ts` defaults to the placeholder provider
and does not import the ML Kit native module. The ML Kit provider remains in
`providers/mlKitOcrProvider.ts` for future native development builds.

Future Tesseract, cloud OCR APIs, or alternate on-device OCR engines should implement the same `OcrProvider` contract.
