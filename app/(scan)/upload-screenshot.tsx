import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";

import { LoadingState, PrimaryButton, ReadableTextBlock, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import type { OcrProcessingStatus } from "@/services/ocr";
import { storageService } from "@/services/storage";
import { OrchestratorAgent } from "@/src/agents";
import { useSessionStore } from "@/store/sessionStore";
import type { OcrResult, UploadedScreenshot } from "@/types/screenSession";
import { createId } from "@/utils/createId";

const orchestratorAgent = new OrchestratorAgent();

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
      setStatusMessage("Gallery access is needed to choose a screenshot. Please allow it in your device settings.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      base64: true,
      mediaTypes: ["images"],
      quality: 1
    });

    if (result.canceled) {
      setStatusMessage("Upload cancelled. Choose an image when you are ready.");
      return;
    }

    const asset = result.assets[0];
    const selectedImage: UploadedScreenshot = {
      base64: asset.base64,
      fileName: asset.fileName,
      height: asset.height,
      mimeType: asset.mimeType,
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
    setStatusMessage("Preparing your screenshot...");

    try {
      const result = await orchestratorAgent.runScreenshotFlow({
        image: selectedImage,
        sessionId,
        onProgress: (message) => {
          setStatus("processing");
          setProgress((currentProgress) => Math.max(currentProgress, 0.35));
          setStatusMessage(message);
        }
      });
      const savedSession = {
        ...result.session,
        savedAt: new Date().toISOString()
      };

      setOcrResult(result.session.ocr ?? null);
      setCurrentSession(savedSession);
      setStatus("complete");
      setProgress(1);
      setImage(result.session.ocr?.sourceImage ?? selectedImage);
      setStatusMessage("All done! Review the results below.");
      try {
        await storageService.saveScreenSession(savedSession);
        setStatusMessage("Saved to your library. Review the results below.");
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
      setStatusMessage("Something went wrong. Try a different screenshot or tap Retry.");
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
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Scan</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Scan a screenshot</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Choose a screenshot from your gallery. ScreenSmart reads the text, understands the screen, and prepares summaries and next steps.
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

        <ScreenCard eyebrow="Reading your screen" title="Extracted text">
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
            <Text className="text-xs font-black uppercase tracking-[1.5px] text-mint">Scan tips</Text>
            <Text className="mt-2 text-base leading-6 text-slate-300">
For better results, use a full-size screenshot with no glare. Crop to the area you want to understand.
            </Text>
          </View>
          <PrimaryButton disabled={!image || status === "processing" || status === "preprocessing"} label="Retry scan" onPress={retryScan} variant="secondary" />
          <PrimaryButton disabled={!ocrResult} label="Open OCR result" onPress={openOcrResult} />
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
