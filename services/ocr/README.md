# OCR service architecture

The OCR layer is provider-based and UI-independent.

- `ocrService.ts` is the app-facing OCR abstraction.
- `providers/` isolates ML Kit, placeholder, and future OCR providers.
- `types.ts` defines structured text blocks, lines, progress events, and provider contracts.

Future Tesseract, cloud OCR APIs, or alternate on-device OCR engines should implement the same `OcrProvider` contract.
