export function connectSSE(url: string, onMessage: (ev: MessageEvent) => void) {
  const source = new EventSource(url);
  const handler = (event: MessageEvent) => onMessage(event);

  source.addEventListener("message", handler);
  source.addEventListener("progress", handler);
  source.addEventListener("done", handler);
  source.addEventListener("error", handler as EventListener);

  return source;
}
