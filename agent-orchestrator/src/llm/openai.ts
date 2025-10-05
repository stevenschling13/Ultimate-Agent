import OpenAI from "openai";

export interface CompleteOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  system?: string;
  jsonSchema?: boolean;
}

export interface CompletionUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface CompletionResult<T = string> {
  text: string;
  usage: CompletionUsage;
  raw: T;
}

export class OpenAIClient {
  private client: OpenAI;
  private model: string;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY required");
    }

    this.client = new OpenAI({ apiKey: key });
    this.model = process.env.OPENAI_MODEL || "gpt-4-turbo";
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
    let delay = 250;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await fn();
      } catch (error: any) {
        const status = error?.status ?? error?.code;
        const isRetryable = [429, 500, 502, 503, 504].includes(Number(status));

        if (attempt === attempts - 1 || !isRetryable) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error("OpenAI request retries exhausted");
  }

  async complete(
    prompt: string,
    opts: CompleteOptions = {}
  ): Promise<CompletionResult<OpenAI.Chat.Completions.ChatCompletion>> {
    return this.withRetry(async () => {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: opts.system ?? "You are precise and terse." },
        { role: "user", content: prompt },
      ];

      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model: opts.model ?? this.model,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 2000,
      };

      if (opts.jsonSchema) {
        params.response_format = { type: "json_object" };
        messages[0].content = `${messages[0].content}\n\nRespond with valid JSON only.`;
      }

      const response = await this.client.chat.completions.create(params);
      const text = response.choices[0]?.message?.content ?? "";

      return {
        text,
        usage: {
          input_tokens: response.usage?.prompt_tokens ?? 0,
          output_tokens: response.usage?.completion_tokens ?? 0,
          total_tokens: response.usage?.total_tokens ?? 0,
        },
        raw: response,
      };
    });
  }

  async synthesizeCode(goal: any, context: any) {
    const prompt = `Generate production-ready Python code.\nTitle: ${goal.title}\nDescription: ${goal.description}\nConstraints: ${JSON.stringify(goal.constraints)}\nSuccess: ${goal.success_criteria.join("; ")}\nContext: ${JSON.stringify(context)}\nRules: one complete module; error handling; type hints; docstrings; modular; testable; include example usage. Return ONLY Python code.`;

    return this.complete(prompt, {
      maxTokens: 4000,
      system: "Expert Python developer. Output only code.",
    });
  }

  async generateTests(code: string, goal: any) {
    const prompt = `Write pytest tests for code.\n\`\`\`python\n${code}\n\`\`\`\nGoal: ${goal.title}\nSuccess: ${goal.success_criteria.join("; ")}\nRules: high coverage; fixtures; edge cases. Output ONLY test code.`;

    return this.complete(prompt, {
      maxTokens: 3000,
      system: "Expert test engineer. Output only code.",
    });
  }

  async validateSolution(code: string, criteria: string[]) {
    const prompt = `Validate Python code against criteria. Respond with JSON.\n\`\`\`python\n${code}\n\`\`\`\nCriteria:\n${criteria.map((criterion, index) => `${index + 1}. ${criterion}`).join("\n")}\nFormat: {"overall_pass":bool,"checks":[{"criterion":"","passed":bool,"details":""}],"suggestions":[]}`;

    const { text, usage } = await this.complete(prompt, {
      maxTokens: 2000,
      system: "Software reviewer. JSON only.",
      jsonSchema: true,
    });

    let json: any;
    try {
      json = JSON.parse(text);
    } catch (error) {
      json = {
        overall_pass: false,
        checks: [],
        suggestions: ["Non-JSON response"],
      };
    }

    return { json, usage };
  }

  async generateDocs(goal: any, hint?: string) {
    const prompt = `Write README.md and API docs for Python module.\nGoal: ${goal.title}\n${hint ?? ""}\nReturn Markdown only.`;

    return this.complete(prompt, {
      maxTokens: 1500,
    });
  }

  async synthesizeComplete(goal: any, context: any) {
    const prompt = `Produce complete Python project.\nGoal: ${goal.title}\nDescription: ${goal.description}\nConstraints: ${JSON.stringify(goal.constraints)}\nFormat: {"code":"","tests":"","readme":""}`;

    const { text, usage } = await this.complete(prompt, {
      maxTokens: 6000,
      system: "Expert Python developer. JSON only.",
      jsonSchema: true,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      parsed = { code: text, tests: "", readme: "" };
    }

    return { content: parsed, usage };
  }
}
