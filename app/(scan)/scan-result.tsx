import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { AppButton, AppScreen, Card, ScreenSection } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function ScanResultRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    confidence?: string;
    extractedText?: string;
    imageUri?: string;
  }>();
  const extractedText = params.extractedText ?? "OCR output preview will appear here after uploading an image.";
  const confidence = params.confidence ? Math.round(Number(params.confidence) * 100) : null;
  const summary = "Summary generation is not connected yet. This screen now receives OCR placeholder text from the upload flow.";

  const openTalkBackChat = () => {
    router.push({
      pathname: routes.talkbackChat,
      params: {
        confidence: confidence ? String(confidence) : undefined,
        extractedText,
        screenTitle: "Latest scan result",
        summary
      }
    });
  };

  return (
    <AppScreen
      title="Scan result"
      subtitle="Review the uploaded image preview and the mock text returned by the OCR placeholder service."
    >
      {params.imageUri ? (
        <Card eyebrow="Image preview" title="Selected screenshot">
          <Image accessibilityLabel="Uploaded screenshot preview" source={{ uri: params.imageUri }} style={styles.preview} />
        </Card>
      ) : null}
      <Card eyebrow="AI summary" title="Plain-language explanation">
        <Text style={styles.summary}>{summary}</Text>
      </Card>
      <Card title="Extracted text">
        <View style={styles.textBlock}>
          <Text style={styles.extractedText}>{extractedText}</Text>
        </View>
        {confidence ? <Text style={styles.confidence}>Mock OCR confidence: {confidence}%</Text> : null}
      </Card>
      <Card title="Suggested actions">
        <ScreenSection
          items={[
            "Listen to the explanation.",
            "Ask a follow-up question in TalkBack chat.",
            "Save the scan to library or notes."
          ]}
        />
        <AppButton label="Listen to result" href={routes.audioPlayer} />
        <AppButton label="Ask TalkBack" onPress={openTalkBackChat} variant="secondary" />
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
  extractedText: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontStyle: "italic",
    lineHeight: 24
  },
  summary: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
    lineHeight: 28
  },
  textBlock: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  preview: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    height: 280,
    width: "100%"
  }
});
