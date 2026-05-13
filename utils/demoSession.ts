/**
 * Demo Session — a pre-seeded ScreenSession for testers and demos.
 *
 * Simulates a bank statement screen being processed by the full agent swarm.
 * Accessible from the Library and Home screen with zero uploading required.
 */

import type { ScreenSession } from "@/types/screenSession";

export const DEMO_SESSION_ID = "demo-screensmart-bank-statement-2024";

export function createDemoSession(): ScreenSession {
  const now = new Date().toISOString();

  return {
    id: DEMO_SESSION_ID,
    title: "Demo: Bank Statement — Chase Checking",
    tags: ["financial", "demo", "bank-statement"],
    createdAt: now,
    savedAt: now,
    lastActiveAt: now,

    ocr: {
      id: DEMO_SESSION_ID,
      extractedText: DEMO_OCR_TEXT,
      rawText: DEMO_OCR_TEXT,
      blocks: [],
      confidence: 0.94,
      provider: "mlkit",
      processedAt: now,
      sourceImage: {
        uri: "",
        base64: undefined,
        fileName: "demo-bank-statement.jpg",
        mimeType: "image/jpeg",
        width: 390,
        height: 844
      }
    },

    summary:
      "This is a Chase Bank checking account statement for October 2024. " +
      "The account holder has a current balance of $3,247.82. " +
      "Notable transactions include a $1,200 rent payment, a $47.99 Netflix subscription, " +
      "and several restaurant charges totaling $183.40. " +
      "The account is in good standing with no overdraft fees.",

    screenIntelligence: {
      screenType: "Financial screen",
      appOrWebsite: "Chase Bank",
      visualSummary:
        "Mobile banking statement showing October 2024 transactions for a Chase checking account.",
      layoutDescription:
        "Standard mobile banking layout with balance at top, followed by a chronological list of transactions.",
      detectedTask: "Review monthly bank statement before acting",
      userIntentGuess: "Understand spending patterns and verify account balance",
      keyEntities: ["Chase Bank", "$3,247.82", "October 2024", "$1,200.00", "Netflix"],
      visibleProblems: [],
      importantVisualElements: ["balance display", "transaction list", "dates", "amounts"],
      importantNumbers: ["$3,247.82", "$1,200.00", "$47.99", "$183.40"],
      suggestedActions: [
        "Summarize this screen",
        "Research this screen",
        "Turn this into notes",
        "Ask TalkBack a question",
        "Save to library",
        "Check for unusual charges"
      ],
      confidence: 0.94,
      fallbackUsed: false,
      reasoningSummary:
        "Classified as Financial screen based on dollar amounts, bank name, and transaction list layout. " +
        "High OCR confidence (94%). No problems detected.",
      summary:
        "Chase Bank checking account statement for October 2024 with balance $3,247.82.",
    },

    agentRuns: [
      {
        id: "demo-run-ocr",
        sessionId: DEMO_SESSION_ID,
        agentId: "screensmart.ocr",
        agentName: "OCRAgent",
        status: "success",
        input: { sessionId: DEMO_SESSION_ID },
        output: { extractedText: DEMO_OCR_TEXT, confidence: 0.94 },
        inputSummary: "Process demo screenshot",
        outputSummary: "89 words extracted at 94% confidence",
        confidence: 0.94,
        durationMs: 312,
        startedAt: now,
        completedAt: now
      },
      {
        id: "demo-run-vision",
        sessionId: DEMO_SESSION_ID,
        agentId: "screensmart.vision",
        agentName: "VisionAgent",
        status: "success",
        input: { extractedText: DEMO_OCR_TEXT },
        output: { screenType: "Financial screen" },
        inputSummary: "Classify bank statement screenshot",
        outputSummary: "Financial screen · Chase Bank · 94% confidence",
        confidence: 0.94,
        durationMs: 1840,
        startedAt: now,
        completedAt: now
      },
      {
        id: "demo-run-summary",
        sessionId: DEMO_SESSION_ID,
        agentId: "screensmart.summary",
        agentName: "SummaryAgent",
        status: "success",
        input: { style: "short" },
        output: { content: "Chase Bank statement, October 2024, balance $3,247.82." },
        inputSummary: "Generate short summary",
        outputSummary: "Summary generated via OpenRouter free",
        confidence: 0.88,
        durationMs: 2100,
        startedAt: now,
        completedAt: now
      }
    ],

    workflowCheckpoints: [
      {
        id: "demo-checkpoint-1",
        sessionId: DEMO_SESSION_ID,
        title: "Review statement before acting",
        description:
          "ScreenSmart identified this as a bank statement. " +
          "Review the balance, check for unexpected charges, and decide if any action is needed.",
        agentId: "core.orchestrator",
        createdAt: now,
        status: "open",
        nextActions: [
          "Generate a full summary",
          "Ask TalkBack about the charges",
          "Research any unfamiliar transaction",
          "Save to library for records"
        ]
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// Demo OCR text — realistic bank statement
// ---------------------------------------------------------------------------

const DEMO_OCR_TEXT = `
Chase Bank
Checking Account Statement
October 1 – October 31, 2024

Account ending: ••••4821
Current balance: $3,247.82
Available balance: $3,247.82

TRANSACTIONS

Oct 01  Opening balance           $4,630.22
Oct 03  Zelle transfer — Mom      -$200.00
Oct 05  WHOLEFDS #0432           -$87.43
Oct 07  NETFLIX.COM               -$47.99
Oct 10  SHELL OIL 7742            -$54.20
Oct 12  CHIPOTLE 1084             -$14.87
Oct 14  PAYCHECK DIRECT DEPOSIT   +$2,450.00
Oct 15  RENT PAYMENT — LANDLORD  -$1,200.00
Oct 18  AMAZON.COM               -$34.99
Oct 19  SWEETGREEN 012            -$16.40
Oct 22  COFFEE BEANERY            -$8.90
Oct 25  CHASE OVERDRAFT FEE       $0.00
Oct 28  ATM WITHDRAWAL            -$100.00
Oct 31  Closing balance           $3,247.82

No overdraft fees this period.
Member FDIC
`.trim();
