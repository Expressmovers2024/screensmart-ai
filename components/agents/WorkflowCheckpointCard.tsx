import { Text, View } from "react-native";

import { PrimaryButton, ScreenCard } from "@/components/ui";
import type { ContinueTaskPlan, WorkflowCheckpoint } from "@/src/agents";

type WorkflowCheckpointCardProps = {
  checkpoints?: WorkflowCheckpoint[];
  plan?: ContinueTaskPlan | null;
  onContinue: () => void;
  onActionPress?: (action: string) => void;
};

export function WorkflowCheckpointCard({
  checkpoints = [],
  plan,
  onContinue,
  onActionPress
}: WorkflowCheckpointCardProps) {
  const activeCheckpoint = plan?.checkpoint ?? checkpoints.find((checkpoint) => checkpoint.status === "open") ?? checkpoints[0];
  const nextActions = plan?.recommendedNextSteps ?? activeCheckpoint?.nextActions ?? [];

  return (
    <ScreenCard eyebrow="Workflow checkpoint" title={activeCheckpoint?.title ?? "Continue this task"}>
      <Text className="text-base leading-7 text-slate-300">
        {activeCheckpoint?.description ?? "Ask the orchestrator for the next best steps from this screen session."}
      </Text>
      {plan?.reasoningSummary ? (
        <Text className="mt-3 text-base leading-7 text-slate-300">{plan.reasoningSummary}</Text>
      ) : null}
      {nextActions.length > 0 ? (
        <View className="mt-5 gap-3">
          {nextActions.map((action, index) => (
            <PrimaryButton
              key={`${action}-${index}`}
              label={action}
              onPress={() => onActionPress?.(action)}
              variant={index === 0 ? "primary" : "secondary"}
            />
          ))}
        </View>
      ) : null}
      <View className="mt-5">
        <PrimaryButton label="Continue This Task" onPress={onContinue} variant="ghost" />
      </View>
    </ScreenCard>
  );
}
