import { OllamaProvider } from "./local/OllamaProvider";
import { MockProvider } from "./mock/MockProvider";
import { OpenRouterProvider } from "./openrouter/OpenRouterProvider";
import { AnthropicProvider } from "./scaffolds/AnthropicProvider";
import { OpenAIProvider } from "./scaffolds/OpenAIProvider";
import type { IProvider, ProviderDescriptor, ProviderHealthStatus } from "./ProviderTypes";

/**
 * ProviderRegistry
 *
 * Single source of truth for all AI providers in ScreenSmart.
 *
 * Usage:
 *   providerRegistry.get("ollama")       — get a specific provider
 *   providerRegistry.list()              — all registered providers
 *   providerRegistry.listAvailable()     — providers where available = true
 *   providerRegistry.checkAll()          — run health checks on all providers
 *
 * To add a new provider:
 *   1. Create the class in src/providers/
 *   2. Instantiate it in the constructor below
 *   3. It's automatically available to ProviderRouter
 */
export class ProviderRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private providers = new Map<string, IProvider>();

  constructor() {
    this.register(new OllamaProvider());
    this.register(new OpenRouterProvider());
    this.register(new MockProvider());
    // Scaffolds — not available until implemented
    this.register(new OpenAIProvider());
    this.register(new AnthropicProvider());
  }

  register(provider: IProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): IProvider | undefined {
    return this.providers.get(id);
  }

  getOrThrow(id: string): IProvider {
    const p = this.providers.get(id);
    if (!p) {
      throw new Error(
        `ProviderRegistry: provider "${id}" not found. ` +
          `Registered: ${Array.from(this.providers.keys()).join(", ")}`
      );
    }
    return p;
  }

  list(): IProvider[] {
    return Array.from(this.providers.values());
  }

  /** Returns providers whose available flag is true */
  listAvailable(): IProvider[] {
    return this.list().filter((p) => p.available);
  }

  /** Descriptors only — safe to serialise for UI */
  listDescriptors(): ProviderDescriptor[] {
    return this.list().map(toDescriptor);
  }

  /** Run health checks on all providers and update their available flags */
  async checkAll(): Promise<ProviderHealthStatus[]> {
    return Promise.all(
      this.list().map(async (provider) => {
        try {
          const status = await provider.healthCheck();
          provider.available = status.available;
          return status;
        } catch {
          provider.available = false;
          return {
            providerId: provider.id,
            available: false,
            checkedAt: new Date().toISOString(),
            error: "Health check threw unexpectedly"
          };
        }
      })
    );
  }

  /** Check a single provider and update its available flag */
  async check(id: string): Promise<ProviderHealthStatus> {
    const provider = this.getOrThrow(id);
    const status = await provider.healthCheck().catch(() => ({
      providerId: id,
      available: false,
      checkedAt: new Date().toISOString(),
      error: "Health check failed"
    }));
    provider.available = status.available;
    return status;
  }
}

/** Singleton — use this throughout the app */
export const providerRegistry = new ProviderRegistry();

function toDescriptor(p: IProvider): ProviderDescriptor {
  return {
    id: p.id,
    name: p.name,
    capabilities: p.capabilities,
    supportsVision: p.supportsVision,
    supportsTools: p.supportsTools,
    supportsStreaming: p.supportsStreaming,
    local: p.local,
    costTier: p.costTier,
    available: p.available
  };
}
