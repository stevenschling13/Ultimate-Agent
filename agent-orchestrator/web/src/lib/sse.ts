export type SSEHandler = (event: MessageEvent) => void;

export function connectSSE(url: string, onMessage: SSEHandler): EventSource {
  const source = new EventSource(url);

  const handler = (event: MessageEvent) => onMessage(event);
  source.addEventListener("message", handler);
  source.addEventListener("progress", handler);
  source.addEventListener("done", handler);
  source.addEventListener("error", handler as EventListener);

  return source;
}
