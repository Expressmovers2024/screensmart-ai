import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";

import { LoadingState, PrimaryButton, ReadableTextBlock, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { ocrService, type OcrProcessingStatus } from "@/services/ocr";
import { storageService } from "@/services/storage";
import { useSessionStore } from "@/store/sessionStore";
import type { OcrResult, UploadedScreenshot } from "@/types/screenSession";
import { createId } from "@/utils/createId";

export default function UploadScreenshotRoute() {
  const router = useRouter();
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);
  const [image, setImage] = useState<UploadedScreenshot | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [status, setStatus] = useState<OcrProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Choose a screenshot from your gallery to begin.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isBusy = status === "preprocessing" || status === "processing";

  const pickImage = async () => {
    setErrorMessage(null);
    setStatusMessage("Requesting gallery access...");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setStatus("error");
      setStatusMessage("Gallery access is required to upload a screenshot.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 1
    });

    if (result.canceled) {
      setStatusMessage("Upload cancelled. Choose an image when you are ready.");
      return;
    }

    const asset = result.assets[0];
    const selectedImage: UploadedScreenshot = {
      fileName: asset.fileName,
      height: asset.height,
      uri: asset.uri,
      width: asset.width
    };
    const nextSessionId = createId("screen-session");

    setSessionId(nextSessionId);
    setImage(selectedImage);
    setOcrResult(null);
    await processImage(selectedImage, nextSessionId);
  };

  const processImage = async (selectedImage: UploadedScreenshot, sessionId = createId("screen-session")) => {
    setErrorMessage(null);
    setProgress(0);
    setStatus("preprocessing");
    setStatusMessage("Preparing screenshot for OCR...");

    try {
      const ocr = await ocrService.extractText({
        image: selectedImage,
        sessionId,
        onProgress: (event) => {
          setStatus(event.status);
          setProgress(event.progress);
          setStatusMessage(event.message);
        }
      });

      const nextSession = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        ocr,
        screenshot: ocr.sourceImage
      };
      const savedSession = {
        ...nextSession,
        savedAt: new Date().toISOString()
      };

      setOcrResult(ocr);
      setCurrentSession(savedSession);
      setStatus("complete");
      setProgress(1);
      setImage(ocr.sourceImage);
      setStatusMessage("OCR complete. Review the extracted text below.");
      try {
        await storageService.saveScreenSession(savedSession);
        setStatusMessage("OCR complete and saved locally. Review the extracted text below.");
      } catch (storageError) {
        setErrorMessage(
          storageError instanceof Error
            ? `OCR complete, but local save failed: ${storageError.message}`
            : "OCR complete, but local save failed."
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR processing failed. Try another screenshot.";

      setStatus("error");
      setErrorMessage(message);
      setStatusMessage("OCR scan failed.");
    }
  };

  const retryScan = async () => {
    if (!image) {
      return;
    }

    setOcrResult(null);
    const retrySessionId = sessionId ?? createId("screen-session");

    setSessionId(retrySessionId);
    await processImage(image, retrySessionId);
  };

  const openOcrResult = () => {
    if (ocrResult) {
      router.push(routes.ocrResult);
    }
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">OCR intake</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Upload screenshot</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Select a screenshot from your gallery, preview it, and run Expo Go-safe placeholder OCR through the provider-based service.
        </Text>
      </View>

      <View className="gap-5">
        <ScreenCard eyebrow="Gallery upload" title="Screenshot source">
          {image ? (
            <Image accessibilityLabel="Uploaded screenshot preview" className="h-80 w-full rounded-[28px] bg-panel" source={{ uri: image.uri }} />
          ) : (
            <View className="h-80 items-center justify-center rounded-[28px] border-2 border-dashed border-white/15 bg-white/5 px-6">
              <Text className="text-5xl font-black text-electric">SS</Text>
              <Text className="mt-4 text-center text-xl font-black text-white">No screenshot selected</Text>
              <Text className="mt-2 text-center text-base leading-6 text-slate-400">
                Choose an image from your gallery to begin OCR processing.
              </Text>
            </View>
          )}
          <Text className="text-base leading-6 text-slate-300">{statusMessage}</Text>
          <PrimaryButton
            disabled={isBusy}
            label={isBusy ? "Scanning..." : image ? "Choose another screenshot" : "Choose screenshot"}
            onPress={pickImage}
          />
        </ScreenCard>

        {isBusy ? (
          <LoadingState
            title={status === "preprocessing" ? "Preparing image" : "Processing screenshot"}
            message={statusMessage}
            progress={progress}
          />
        ) : null}

        <ScreenCard eyebrow="OCR output" title="Extracted text preview">
          <ReadableTextBlock text={ocrResult?.extractedText ?? "Extracted text will appear here after OCR processing."} />
          {ocrResult ? (
            <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              Confidence {Math.round(ocrResult.confidence * 100)}% • {ocrResult.provider}
            </Text>
          ) : null}
          {errorMessage ? (
            <View className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4">
              <Text className="text-base font-bold leading-6 text-red-100">{errorMessage}</Text>
            </View>
          ) : null}
          <View className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <Text className="text-sm font-black uppercase tracking-[1.5px] text-mint">Improve scan</Text>
            <Text className="mt-2 text-base leading-6 text-slate-300">
              For better OCR, crop around the screen, avoid glare, and use a high-resolution screenshot.
            </Text>
          </View>
          <PrimaryButton disabled={!image || status === "processing" || status === "preprocessing"} label="Retry scan" onPress={retryScan} variant="secondary" />
          <PrimaryButton disabled={!ocrResult} label="Open OCR result" onPress={openOcrResult} />
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
