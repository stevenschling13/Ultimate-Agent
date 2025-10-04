export function transform<T>(data: T[], ops: Array<{ type: "filter"|"map"|"reduce"; fn: any; initial?: any }>): any {
  let result: any = data;
  for (const op of ops) {
    if (op.type === "filter") result = result.filter(op.fn);
    else if (op.type === "map") result = result.map(op.fn);
    else if (op.type === "reduce") result = result.reduce(op.fn, op.initial);
  }
  return result;
}
export function aggregate<T extends Record<string, any>>(data: T[], groupBy: keyof T, reducers: Record<string, (items: T[])=>any>) {
  const groups = new Map<any, T[]>();
  for (const item of data) { const key = item[groupBy]; groups.set(key, [...(groups.get(key) ?? []), item]); }
  return [...groups.entries()].map(([key, items]) => { const row: Record<string, any> = { [String(groupBy)]: key, count: items.length }; for (const [name, fn] of Object.entries(reducers)) row[name] = fn(items); return row; });
}
