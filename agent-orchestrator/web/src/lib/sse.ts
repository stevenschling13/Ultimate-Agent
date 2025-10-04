export function connectSSE(url: string, onMessage: (ev: MessageEvent)=>void) {
  const es = new EventSource(url);
  es.onmessage = onMessage; return es;
}
