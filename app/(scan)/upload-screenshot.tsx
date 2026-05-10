import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { AppButton, AppScreen, Card, ScreenSection } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { mockOcrService, type OcrResult } from "../../src/services/ocr";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  width?: number;
  height?: number;
};

export default function UploadScreenshotRoute() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("Choose an image to run mock OCR.");
  const [isProcessing, setIsProcessing] = useState(false);

  const chooseScreenshot = async () => {
    setStatusMessage("Requesting photo library access...");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setStatusMessage("Photo library access is needed to choose a screenshot.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 1
    });

    if (pickerResult.canceled) {
      setStatusMessage("Image selection cancelled.");
      return;
    }

    const asset = pickerResult.assets[0];
    const nextImage: SelectedImage = {
      fileName: asset.fileName,
      height: asset.height,
      uri: asset.uri,
      width: asset.width
    };

    setSelectedImage(nextImage);
    setOcrResult(null);
    setIsProcessing(true);
    setStatusMessage("Running placeholder OCR...");

    try {
      const result = await mockOcrService.extractTextFromImage(nextImage);

      setOcrResult(result);
      setStatusMessage("Mock OCR complete.");
    } finally {
      setIsProcessing(false);
    }
  };

  const continueToResult = () => {
    if (!selectedImage || !ocrResult) {
      return;
    }

    router.push({
      pathname: routes.scanResult,
      params: {
        confidence: String(ocrResult.confidence),
        extractedText: ocrResult.extractedText,
        imageUri: selectedImage.uri
      }
    });
  };

  return (
    <AppScreen
      title="Upload screenshot"
      subtitle="Choose an image from your library, preview it, and pass it through the OCR placeholder service."
    >
      <Card eyebrow="Image source" title="Screenshot picker">
        {selectedImage ? (
          <Image accessibilityLabel="Selected screenshot preview" source={{ uri: selectedImage.uri }} style={styles.preview} />
        ) : (
          <View style={styles.dropzone}>
            <Text style={styles.icon}>SS</Text>
            <Text style={styles.dropzoneTitle}>No screenshot selected</Text>
            <Text style={styles.dropzoneText}>Pick a screenshot or saved image from your device.</Text>
          </View>
        )}
        <Text style={styles.status}>{statusMessage}</Text>
        <AppButton
          label={selectedImage ? "Choose different image" : "Choose screenshot"}
          variant="secondary"
          onPress={chooseScreenshot}
          disabled={isProcessing}
        />
      </Card>
      <Card eyebrow="OCR placeholder" title="Mock extracted text">
        <View style={styles.textBlock}>
          <Text style={styles.extractedText}>
            {ocrResult?.extractedText ?? "Select an image to generate mock extracted text."}
          </Text>
        </View>
        {ocrResult ? <Text style={styles.confidence}>Confidence: {Math.round(ocrResult.confidence * 100)}%</Text> : null}
        <AppButton label="Continue to scan result" onPress={continueToResult} disabled={!ocrResult || isProcessing} />
      </Card>
      <Card title="Service architecture">
        <ScreenSection
          items={[
            "Image picking stays in the upload route.",
            "OCR behavior is isolated behind src/services/ocr.",
            "The result route receives image and text data through navigation params."
          ]}
        />
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  confidence: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  dropzone: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.xl
  },
  dropzoneText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: "center"
  },
  dropzoneTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  icon: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    color: colors.surface,
    fontSize: typography.title,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  extractedText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24
  },
  preview: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    height: 280,
    width: "100%"
  },
  status: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  textBlock: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md
  }
});
