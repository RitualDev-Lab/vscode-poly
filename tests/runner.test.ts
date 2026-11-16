import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import test from "node:test";
import { PolyWorkspace } from "../src/workspace.js";

test("PolyWorkspace - Monorepo Discovery & Manifest Parsing", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-poly-test-"));

  // Mock workspace with Node web app and Rust core crate
  const webDir = path.join(tmpDir, "apps", "web");
  fs.mkdirSync(webDir, { recursive: true });
  fs.writeFileSync(
    path.join(webDir, "package.json"),
    JSON.stringify({
      name: "web",
      version: "1.0.0",
      dependencies: { zod: "^3.23.8" },
      devDependencies: { typescript: "^5.6.3" },
    }),
  );

  const rustDir = path.join(tmpDir, "crates", "core");
  fs.mkdirSync(rustDir, { recursive: true });
  fs.writeFileSync(
    path.join(rustDir, "Cargo.toml"),
    `[package]
name = "core"
version = "0.1.0"

[dependencies]
tokio = "1.40.0"
serde = "1.0"`,
  );

  await t.test("discovers monorepo members across subdirectories", () => {
    const members = PolyWorkspace.discoverWorkspace(tmpDir);
    assert.ok(members.length >= 2);

    const webMember = members.find((m) => m.name.includes("web"));
    assert.ok(webMember);
    assert.equal(webMember.ecosystem, "npm");
    assert.equal(webMember.dependencies.length, 2);

    const rustMember = members.find((m) => m.name.includes("core"));
    assert.ok(rustMember);
    assert.equal(rustMember.ecosystem, "cargo");
    assert.equal(rustMember.dependencies.length, 2);
  });

  await t.test("verifies valid poly.lock", () => {
    fs.writeFileSync(
      path.join(tmpDir, "poly.lock"),
      `version = 1
hash = "4e88d7b0a912fd834b"
timestamp = "2026-11-16T10:00:00Z"

[[members]]
path = "apps/web"
ecosystem = "npm"

[[members]]
path = "crates/core"
ecosystem = "cargo"`,
    );

    const res = PolyWorkspace.verifyLock(tmpDir);
    assert.equal(res.valid, true);
    assert.equal(res.hash, "4e88d7b0a912fd834b");
    assert.equal(res.membersCount, 2);
  });

  await t.test("returns invalid when poly.lock does not exist", () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "poly-empty-"));
    const res = PolyWorkspace.verifyLock(emptyDir);
    assert.equal(res.valid, false);
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
