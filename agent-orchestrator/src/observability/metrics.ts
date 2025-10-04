export const Metrics = {
  counters: new Map<string, number>(),
  inc(key: string, n = 1) { this.counters.set(key, (this.counters.get(key) ?? 0) + n); },
  snapshot() { return Object.fromEntries(this.counters.entries()); }
};
