import type {
  AgentContext,
  AgentDepartment,
  AgentExecutionResult,
  AgentLike,
  AgentMetadata,
  AgentStatus
} from "./AgentTypes";
import { AgentTimeline } from "./AgentTimeline";

export abstract class BaseAgent<TInput = unknown, TOutput = unknown>
  implements AgentLike<TInput, TOutput>
{
  id: string;
  name: string;
  department: AgentDepartment;
  role: string;
  description: string;
  status: AgentStatus = "idle";
  input?: TInput;
  output?: TOutput;
  errors: string[] = [];

  protected constructor(metadata: AgentMetadata) {
    this.id = metadata.id;
    this.name = metadata.name;
    this.department = metadata.department;
    this.role = metadata.role;
    this.description = metadata.description;
  }

  async execute(input: TInput, context: AgentContext): Promise<AgentExecutionResult<TOutput>> {
    const timeline = getTimeline(context);
    const run = timeline.start({
      agentId: this.id,
      agentName: this.name,
      input,
      sessionId: context.sessionId
    });

    this.status = "running";
    this.input = input;
    this.errors = [];
    context.onProgress?.(`${this.name} running`);

    try {
      const output = await this.run(input, context);

      this.status = "success";
      this.output = output;
      const completedRun = timeline.complete(run.id, "success", output) ?? run;
      context.timeline = timeline.list();
      return { output, run: completedRun };
    } catch (error) {
      const message = error instanceof Error ? error.message : `${this.name} failed`;
      const output = this.safeFallback(input, context, message);

      this.status = "error";
      this.output = output;
      this.errors = [message];
      const completedRun = timeline.complete(run.id, "error", output, message) ?? run;
      context.timeline = timeline.list();
      return { output, run: completedRun };
    }
  }

  abstract run(input: TInput, context: AgentContext): Promise<TOutput>;

  protected safeFallback(_input: TInput, _context: AgentContext, error: string): TOutput {
    return {
      fallback: true,
      message: `${this.name} used a safe fallback response.`,
      error
    } as TOutput;
  }
}

function getTimeline(context: AgentContext) {
  const timeline = new AgentTimeline();

  if (context.timeline) {
    timeline.merge(context.timeline);
  }

  return timeline;
}
