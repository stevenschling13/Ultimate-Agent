import { writeFile as fsWrite, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
export async function writeFile(name: string, content: string) {
  const file = join(process.cwd(), "out", name);
  await mkdir(dirname(file), { recursive: true });
  await fsWrite(file, content);
  return { success: true, path: `out/${name}`, size: Buffer.byteLength(content) };
}
