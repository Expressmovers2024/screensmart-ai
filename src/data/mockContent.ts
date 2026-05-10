import type { LibraryItem, Note, ScanResult } from "../types/content";

export const demoScanResult: ScanResult = {
  id: "scan-demo-001",
  screenshotName: "Banking app screenshot",
  extractedText:
    "Monthly transfer due today. Balance: $1,284. Transaction fee applies after 5 PM.",
  summary:
    "This screen appears to show a banking reminder about a transfer due today, with a current balance and a fee warning.",
  suggestedActions: [
    "Review the transfer details before submitting.",
    "Check whether the fee can be avoided by completing the action earlier.",
    "Save this summary to notes if you need to revisit it."
  ],
  insights: [
    {
      id: "deadline",
      label: "Time-sensitive",
      body: "There is a same-day deadline and a possible fee after 5 PM."
    },
    {
      id: "money",
      label: "Financial context",
      body: "The screen includes balance and transfer information, so confirm amounts carefully."
    }
  ]
};

export const libraryItems: LibraryItem[] = [
  {
    id: "lib-001",
    title: "Bank transfer reminder",
    summary: demoScanResult.summary,
    createdAt: "Today",
    tags: ["Finance", "Reminder"]
  },
  {
    id: "lib-002",
    title: "Travel booking policy",
    summary: "ScreenSmart highlighted cancellation rules and the refund window.",
    createdAt: "Yesterday",
    tags: ["Travel", "Policy"]
  }
];

export const notes: Note[] = [
  {
    id: "note-001",
    title: "Questions for bank support",
    body: "Ask whether same-day transfer fees can be waived for this account.",
    updatedAt: "Today"
  },
  {
    id: "note-002",
    title: "App accessibility ideas",
    body: "Prioritize voice playback, simple summaries, and TalkBack-friendly controls.",
    updatedAt: "This week"
  }
];
