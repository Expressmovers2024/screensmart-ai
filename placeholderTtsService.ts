const MAX_CONTEXT_CHARS = 9000;

export function chunkOcrTextForAi(text: string, maxChars = MAX_CONTEXT_CHARS) {
  const normalizedText = text.trim();

  if (normalizedText.length <= maxChars) {
    return [normalizedText];
  }

  const paragraphs = normalizedText.split(/\n{2,}/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const nextChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;

    if (nextChunk.length > maxChars && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = paragraph.slice(0, maxChars);
    } else {
      currentChunk = nextChunk.slice(0, maxChars);
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [normalizedText.slice(0, maxChars)];
}

export function getSafeAiContext(text: string, maxChars = MAX_CONTEXT_CHARS) {
  const chunks = chunkOcrTextForAi(text, maxChars);

  return {
    chunks,
    truncatedText: chunks[0],
    wasTruncated: chunks.length > 1
  };
}
