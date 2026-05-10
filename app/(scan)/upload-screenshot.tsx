import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";

import { LoadingState, PrimaryButton, ReadableTextBlock, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { placeholderOcrService, type OcrProcessingStatus } from "@/services/ocr";
import { useSessionStore } from "@/store/sessionStore";
import type { OcrResult, UploadedScreenshot } from "@/types/screenSession";
import { createId } from "@/utils/createId";

export default function UploadScreenshotRoute() {
  const router = useRouter();
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);
  const [image, setImage] = useState<UploadedScreenshot | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [status, setStatus] = useState<OcrProcessingStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("Choose a screenshot from your gallery to begin.");

  const pickImage = async () => {
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
    const sessionId = createId("screen-session");

    setImage(selectedImage);
    setOcrResult(null);
    setStatus("processing");
    setStatusMessage("ScreenSmart is running placeholder OCR...");

    try {
      const ocr = await placeholderOcrService.extractText({
        image: selectedImage,
        sessionId
      });

      setOcrResult(ocr);
      setCurrentSession({
        id: sessionId,
        createdAt: new Date().toISOString(),
        ocr,
        screenshot: selectedImage
      });
      setStatus("complete");
      setStatusMessage("Mock OCR complete. Review the extracted text below.");
    } catch {
      setStatus("error");
      setStatusMessage("OCR processing failed. Try another screenshot.");
    }
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
          Select a screenshot from your gallery, preview it, and run placeholder OCR in a service-isolated flow.
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
            disabled={status === "processing"}
            label={image ? "Choose another screenshot" : "Choose screenshot"}
            onPress={pickImage}
          />
        </ScreenCard>

        {status === "processing" ? (
          <LoadingState
            title="Processing screenshot"
            message="Running mock OCR extraction. Real OCR will connect behind services/ocr later."
          />
        ) : null}

        <ScreenCard eyebrow="Mock OCR" title="Extracted text preview">
          <ReadableTextBlock text={ocrResult?.extractedText ?? "Extracted text will appear here after OCR processing."} />
          {ocrResult ? (
            <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              Confidence {Math.round(ocrResult.confidence * 100)}% • {ocrResult.provider}
            </Text>
          ) : null}
          <PrimaryButton disabled={!ocrResult} label="Open OCR result" onPress={openOcrResult} />
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
