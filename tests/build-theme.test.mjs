import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const ROOT = resolve(import.meta.dirname, "..");
const CSS_PATH = resolve(ROOT, "src/generated/theme.css");

test("build-theme generates theme.css from site.yaml", () => {
  execSync("node scripts/build-theme.mjs", { cwd: ROOT, stdio: "pipe" });
  assert.ok(existsSync(CSS_PATH), "theme.css should be generated");
  const css = readFileSync(CSS_PATH, "utf8");
  assert.match(css, /--color-primary:\s*#7f9df2/);
  assert.match(css, /--color-bg:\s*#0e1230/);
  assert.match(css, /--card-radius:\s*22px/);
});

test("build-theme fails on invalid YAML schema", async () => {
  const { siteConfigSchema } = await import("../config/schema.ts");
  const result = siteConfigSchema.safeParse({});
  assert.equal(result.success, false, "should reject empty config");
});
