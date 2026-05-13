import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

import type { UploadedScreenshot } from "../types";

const MAX_OCR_DIMENSION = 1800;

export async function preprocessImageForOcr(image: UploadedScreenshot): Promise<UploadedScreenshot> {
  const width = image.width ?? 0;
  const height = image.height ?? 0;
  const largestDimension = Math.max(width, height);

  if (!largestDimension || largestDimension <= MAX_OCR_DIMENSION) {
    const optimized = await manipulateAsync(image.uri, [], {
      compress: 0.92,
      format: SaveFormat.JPEG
    });

    return {
      ...image,
      height: optimized.height,
      uri: optimized.uri,
      width: optimized.width
    };
  }

  const scale = MAX_OCR_DIMENSION / largestDimension;
  const resizedWidth = Math.round(width * scale);
  const resizedHeight = Math.round(height * scale);
  const optimized = await manipulateAsync(
    image.uri,
    [
      {
        resize: {
          height: resizedHeight,
          width: resizedWidth
        }
      }
    ],
    {
      compress: 0.92,
      format: SaveFormat.JPEG
    }
  );

  return {
    ...image,
    height: optimized.height,
    uri: optimized.uri,
    width: optimized.width
  };
}
