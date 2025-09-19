import { resolve, join } from "node:path";
const tmpDirBase = resolve(
  Deno.env.get("TMPDIR") ??
    (Deno.build.os === "windows" ? "C:\\Windows\\Temp" : "/tmp"),
  "advanced_mcp_server"
);

export async function getTmpDir(name: string) {
  const target = join(tmpDirBase, name);
  try {
    await Deno.mkdir(target, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }

  return target;
}
