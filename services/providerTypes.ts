export type ProviderLifecycleState = "available" | "unconfigured" | "disabled";

export type ProviderDescriptor<ProviderId extends string> = {
  id: ProviderId;
  label: string;
  lifecycleState: ProviderLifecycleState;
  supportsStreaming?: boolean;
  notes?: string;
};
