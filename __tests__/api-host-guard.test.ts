import fs from "fs";
import path from "path";
import { API_BASE_URL } from "../src/config/api";

// Built by concatenation so the literal never appears in source. The Frankfurt
// host "portuguese-verb-api-fra.onrender.com" does not contain this needle as a
// substring, so a plain includes() check is safe.
const OREGON_HOST = ["portuguese-verb-api", "onrender.com"].join(".");

const REPO_ROOT = path.join(__dirname, "..");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

describe("API host guard", () => {
  it.each(["src", "scripts"])("no Oregon host in %s/", (dir) => {
    const files = walk(path.join(REPO_ROOT, dir));
    expect(files.length).toBeGreaterThan(0);
    const offenders = files
      .filter((f) => fs.readFileSync(f, "utf8").includes(OREGON_HOST))
      .map((f) => path.relative(REPO_ROOT, f));
    expect(offenders).toEqual([]);
  });

  it("API_BASE_URL is the Frankfurt host", () => {
    expect(API_BASE_URL).toBe("https://portuguese-verb-api-fra.onrender.com");
  });

  it("scripts/preflight.ts BASE_URL matches API_BASE_URL", () => {
    const text = fs.readFileSync(
      path.join(REPO_ROOT, "scripts", "preflight.ts"),
      "utf8",
    );
    const match = text.match(/const BASE_URL = "([^"]+)"/);
    expect(match?.[1]).toBe(API_BASE_URL);
  });
});
