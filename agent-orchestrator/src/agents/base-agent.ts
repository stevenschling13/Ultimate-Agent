import OpenAI from "openai";
import { AgentRole, AgentContext } from "../types";
import { metrics } from "../observability/metrics";

export abstract class BaseAgent {
  protected client: OpenAI;
  protected model: string;

  constructor(
    protected role: AgentRole,
    protected systemPrompt: string
  ) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY required");
    this.client = new OpenAI({ apiKey: key });
    this.model = process.env.OPENAI_MODEL || "gpt-4-turbo";
  }

  abstract canHandle(taskType: string): boolean;

  protected async reason(prompt: string, context: AgentContext): Promise<string> {
    const start = Date.now();
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: this.systemPrompt },
        ...context.messages.map((message) => ({ role: message.role, content: message.content })),
        { role: "user", content: prompt },
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      metrics.inc(`agent.${this.role}.calls`);
      metrics.record(`agent.${this.role}.latency`, Date.now() - start);
      metrics.inc("tokens.total", response.usage?.total_tokens ?? 0);

      return response.choices[0]?.message?.content ?? "";
    } catch (error: any) {
      metrics.inc(`agent.${this.role}.errors`);
      throw error;
    }
  }

  async execute(task: string, context: AgentContext): Promise<any> {
    const reasoning = await this.reason(
      `Task: ${task}\n\nReason step-by-step about how to solve this.`,
      context
    );

    const action = await this.act(reasoning, context);

    return { reasoning, action, agent: this.role };
  }

  protected abstract act(reasoning: string, context: AgentContext): Promise<any>;
}
