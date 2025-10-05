class MetricsCollector {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  inc(key: string, value = 1) {
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  record(key: string, value: number) {
    const values = this.histograms.get(key) ?? [];
    values.push(value);
    if (values.length > 1000) values.shift();
    this.histograms.set(key, values);
  }

  snapshot() {
    return {
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([k, v]) => {
          if (v.length === 0) {
            return [k, { count: 0, mean: 0, p95: 0 }];
          }
          const sorted = [...v].sort((a, b) => a - b);
          const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
          const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
          return [k, { count: sorted.length, mean, p95 }];
        })
      ),
    };
  }
}

export const metrics = new MetricsCollector();
