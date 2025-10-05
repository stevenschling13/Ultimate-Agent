import { OpenAIClient } from "../llm/openai";

export class ToolRegistry {
  openai = new OpenAIClient();
}
