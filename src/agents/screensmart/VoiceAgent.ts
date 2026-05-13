import { ttsService } from "@/services/tts";

import { BaseAgent } from "../core/BaseAgent";

type VoiceAgentInput = {
  text: string;
};

type VoiceAgentOutput = {
  estimatedSeconds: number;
  chunks: number;
};

export class VoiceAgent extends BaseAgent<VoiceAgentInput, VoiceAgentOutput> {
  constructor() {
    super({
      id: "screensmart.voice",
      name: "VoiceAgent",
      department: "screensmart",
      role: "Prepare audio reading context",
      description: "Uses the TTS abstraction to estimate spoken playback for screen summaries."
    });
  }

  async run(input: VoiceAgentInput): Promise<VoiceAgentOutput> {
    const chunks = ttsService.splitIntoReadableChunks(input.text);

    return {
      chunks: chunks.length,
      estimatedSeconds: ttsService.estimateReadingTime(input.text, 1)
    };
  }
}
