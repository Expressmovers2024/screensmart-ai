import { useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

import { BottomNav } from "./src/components/BottomNav";
import { demoScanResult } from "./src/data/mockContent";
import { aiService, ocrService, supabaseService } from "./src/services";
import { AudioPlayerScreen } from "./src/screens/AudioPlayerScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { NotesScreen } from "./src/screens/NotesScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ScanResultScreen } from "./src/screens/ScanResultScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TalkBackChatScreen } from "./src/screens/TalkBackChatScreen";
import { UploadScreenshotScreen } from "./src/screens/UploadScreenshotScreen";
import { colors } from "./src/theme/colors";
import type { ScanResult, ScreenshotSource } from "./src/types/content";
import type { Navigate, ScreenKey } from "./src/types/navigation";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>("onboarding");
  const [scanResult, setScanResult] = useState<ScanResult>(demoScanResult);
  const [isScanning, setIsScanning] = useState(false);

  const navigate: Navigate = (screen) => setCurrentScreen(screen);

  const runDemoScan = async () => {
    if (isScanning) {
      return;
    }

    setIsScanning(true);

    const source: ScreenshotSource = {
      id: `screenshot-${Date.now()}`,
      capturedAt: new Date().toISOString(),
      name: "Demo screenshot",
      sourceType: "demo"
    };

    try {
      const ocr = await ocrService.extractText(source);
      const ai = await aiService.summarizeScreen(ocr.text);

      setScanResult({
        id: `scan-${Date.now()}`,
        extractedText: ocr.text,
        screenshotName: source.name,
        ...ai
      });
      navigate("result");
    } finally {
      setIsScanning(false);
    }
  };

  const saveCurrentScan = async () => {
    await supabaseService.saveScan(scanResult);

    navigate("library");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "onboarding":
        return <OnboardingScreen navigate={navigate} />;
      case "home":
        return <HomeScreen navigate={navigate} />;
      case "upload":
        return <UploadScreenshotScreen isScanning={isScanning} navigate={navigate} onRunDemoScan={runDemoScan} />;
      case "result":
        return <ScanResultScreen navigate={navigate} onSaveScan={saveCurrentScan} result={scanResult} />;
      case "audio":
        return <AudioPlayerScreen navigate={navigate} result={scanResult} />;
      case "talkback":
        return <TalkBackChatScreen navigate={navigate} result={scanResult} />;
      case "library":
        return <LibraryScreen navigate={navigate} />;
      case "notes":
        return <NotesScreen navigate={navigate} />;
      case "settings":
        return <SettingsScreen navigate={navigate} />;
      default:
        return <HomeScreen navigate={navigate} />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      {renderScreen()}
      {currentScreen !== "onboarding" ? <BottomNav currentScreen={currentScreen} navigate={navigate} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  }
});
