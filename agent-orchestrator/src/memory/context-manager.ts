import { Message } from "../types";

export class ContextManager {
  private contexts = new Map<string, Message[]>();
  private maxMessages = 50;

  add(sessionId: string, message: Message) {
    const msgs = this.contexts.get(sessionId) ?? [];
    msgs.push(message);
    if (msgs.length > this.maxMessages) msgs.shift();
    this.contexts.set(sessionId, msgs);
  }

  get(sessionId: string): Message[] {
    return this.contexts.get(sessionId) ?? [];
  }

  clear(sessionId: string) {
    this.contexts.delete(sessionId);
  }
}
