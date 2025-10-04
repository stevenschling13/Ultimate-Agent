import OpenAI from "openai";

export interface CompleteOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  system?: string;
  jsonSchema?: any; // Structured Outputs
}

export class OpenAIClient {
  private client: OpenAI;
  private model: string;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY environment variable is required for OpenAIClient");
    }
    this.client = new OpenAI({ apiKey: key });
    this.model = process.env.OPENAI_MODEL || "gpt-5";
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
    let delay = 250;
    for (let i = 0; i < attempts; i++) {
      try { return await fn(); }
      catch (e: any) {
        const retryable = [429, 500, 502, 503, 504].some(c => String(e?.status || e?.code || "").includes(String(c)));
        if (i === attempts - 1 || !retryable) throw e;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
    throw new Error("unreachable");
  }

  async complete(prompt: string, opts: CompleteOptions = {}) {
    const useModel = opts.model || this.model;
    return this.withRetry(async () => {
      const res = await this.client.responses.create({
        model: useModel,
        input: [
          { role: "system", content: [{ type: "text", text: opts.system ?? "You are precise and terse." }]},
          { role: "user", content: [{ type: "text", text: prompt }] }
        ],
        temperature: opts.temperature ?? 0.4,
        max_output_tokens: opts.maxTokens ?? 2000,
        ...(opts.jsonSchema ? { response_format: { type: "json_schema", json_schema: opts.jsonSchema } } : {})
      });
      const text = String(res.output_text ?? "");
      const usage = res.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
      return { text, usage, raw: res } as const;
    });
  }

  async synthesizeCode(goal: any, context: any) {
    const prompt = `Generate production-ready Python code.
Title: ${goal.title}
Description: ${goal.description}
Constraints: ${JSON.stringify(goal.constraints)}
Success: ${goal.success_criteria.join("; ")}
Context: ${JSON.stringify(context)}
Rules: one complete module; error handling; type hints; docstrings; modular; testable; include example usage.
Return ONLY Python code.`;
    return this.complete(prompt, { maxTokens: 4000, system: "Expert Python developer. Output only code." });
  }

  async generateTests(code: string, goal: any) {
    const prompt = `Write pytest tests for code.

\`\`\`python
${code}
\`\`\`
Goal: ${goal.title}
Success: ${goal.success_criteria.join("; ")}
Rules: high coverage; fixtures as needed; edge cases. Output ONLY test code.`;
    return this.complete(prompt, { maxTokens: 3000, system: "Expert test engineer. Output only code." });
  }

  async validateSolution(code: string, criteria: string[]) {
    const schema = {
      name: "ValidationResult",
      schema: {
        type: "object",
        properties: {
          overall_pass: { type: "boolean" },
          checks: { type: "array", items: { type: "object", properties: { criterion: { type: "string" }, passed: { type: "boolean" }, details: { type: "string" } }, required: ["criterion","passed","details"] } },
          suggestions: { type: "array", items: { type: "string" } }
        },
        required: ["overall_pass","checks","suggestions"],
        additionalProperties: false
      }
    };
    const prompt = `Validate this Python code against criteria.
Code:
\`\`\`python
${code}
\`\`\`
Criteria:
${criteria.map((c,i)=>`${i+1}. ${c}`).join("\n")}`;
    const { text, usage } = await this.complete(prompt, { maxTokens: 2000, system: "Software reviewer.", jsonSchema: schema });
    let json: any; try { json = JSON.parse(text); } catch { json = { overall_pass: false, checks: [], suggestions: ["Non-JSON response"] }; }
    return { json, usage } as const;
  }

  async generateDocs(goal: any, hint?: string) {
    const prompt = `Write README.md and brief API docs for a Python module. Goal: ${goal.title}. ${hint ?? ""}
Return Markdown only.`;
    return this.complete(prompt, { maxTokens: 1500 });
  }

  async synthesizeComplete(goal: any, context: any) {
    const prompt = `Produce JSON: { code: string, tests: string, readme: string } for a Python project meeting goal: ${goal.title}. Constraints: ${JSON.stringify(goal.constraints)}.`;
    const schema = { name: "Bundle", schema: { type: "object", properties: { code: { type: "string" }, tests: { type: "string" }, readme: { type: "string" } }, required: ["code","tests","readme"], additionalProperties: false } };
    const { text, usage } = await this.complete(prompt, { maxTokens: 6000, system: "Return JSON only.", jsonSchema: schema });
    let parsed: any; try { parsed = JSON.parse(text); } catch { parsed = { code: text, tests: "", readme: "" }; }
    return { content: parsed, usage } as const;
  }
}
