import * as fs from "node:fs";
import * as path from "node:path";
import type {
  DependencyInfo,
  Ecosystem,
  LockfileVerificationResult,
  WorkspaceMemberInfo,
} from "./types.js";

export class PolyWorkspace {
  /**
   * Discovers workspace members across root and standard subdirectories
   */
  static discoverWorkspace(rootPath: string): WorkspaceMemberInfo[] {
    const members: WorkspaceMemberInfo[] = [];

    // Check root directory manifests
    const rootEcosystems = PolyWorkspace.detectDirEcosystems(rootPath);
    for (const eco of rootEcosystems) {
      members.push({
        name: path.basename(rootPath),
        relativeDir: ".",
        fullPath: rootPath,
        ecosystem: eco.ecosystem,
        manifestFile: eco.manifestFile,
        dependencies: PolyWorkspace.parseManifestDependencies(
          path.join(rootPath, eco.manifestFile),
          eco.ecosystem,
        ),
      });
    }

    // Traverse 1-2 levels of subdirectories for monorepo packages
    const subDirs = ["apps", "services", "packages", "crates", "pkg", "cmd"];
    for (const sub of subDirs) {
      const parentPath = path.join(rootPath, sub);
      if (fs.existsSync(parentPath) && fs.statSync(parentPath).isDirectory()) {
        const entries = fs.readdirSync(parentPath);
        for (const entry of entries) {
          const entryPath = path.join(parentPath, entry);
          if (fs.existsSync(entryPath) && fs.statSync(entryPath).isDirectory()) {
            const entryEcos = PolyWorkspace.detectDirEcosystems(entryPath);
            for (const eco of entryEcos) {
              members.push({
                name: `${sub}/${entry}`,
                relativeDir: path.join(sub, entry),
                fullPath: entryPath,
                ecosystem: eco.ecosystem,
                manifestFile: eco.manifestFile,
                dependencies: PolyWorkspace.parseManifestDependencies(
                  path.join(entryPath, eco.manifestFile),
                  eco.ecosystem,
                ),
              });
            }
          }
        }
      }
    }

    return members;
  }

  static detectDirEcosystems(
    dirPath: string,
  ): Array<{ ecosystem: Ecosystem; manifestFile: string }> {
    const list: Array<{ ecosystem: Ecosystem; manifestFile: string }> = [];

    if (fs.existsSync(path.join(dirPath, "package.json"))) {
      list.push({ ecosystem: "npm", manifestFile: "package.json" });
    }
    if (
      fs.existsSync(path.join(dirPath, "pyproject.toml")) ||
      fs.existsSync(path.join(dirPath, "requirements.txt"))
    ) {
      list.push({
        ecosystem: "pypi",
        manifestFile: fs.existsSync(path.join(dirPath, "pyproject.toml"))
          ? "pyproject.toml"
          : "requirements.txt",
      });
    }
    if (fs.existsSync(path.join(dirPath, "Cargo.toml"))) {
      list.push({ ecosystem: "cargo", manifestFile: "Cargo.toml" });
    }
    if (fs.existsSync(path.join(dirPath, "go.mod"))) {
      list.push({ ecosystem: "go", manifestFile: "go.mod" });
    }

    return list;
  }

  static parseManifestDependencies(manifestPath: string, ecosystem: Ecosystem): DependencyInfo[] {
    const deps: DependencyInfo[] = [];
    if (!fs.existsSync(manifestPath)) return deps;

    try {
      const content = fs.readFileSync(manifestPath, "utf-8");

      if (ecosystem === "npm") {
        const pkg = JSON.parse(content);
        const all = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const [name, version] of Object.entries(all)) {
          deps.push({
            name,
            version: String(version),
            ecosystem: "npm",
          });
        }
      } else if (ecosystem === "pypi" && manifestPath.endsWith("pyproject.toml")) {
        const lines = content.split("\n");
        let inDependencies = false;
        for (const line of lines) {
          if (line.includes("dependencies = [")) inDependencies = true;
          else if (inDependencies) {
            if (line.includes("]")) inDependencies = false;
            else {
              const cleaned = line.replace(/["',]/g, "").trim();
              if (cleaned) {
                const parts = cleaned.split(/(>=|<=|==|~=|>|<)/);
                deps.push({
                  name: parts[0]?.trim() || cleaned,
                  version: parts[2]?.trim() || "*",
                  ecosystem: "pypi",
                });
              }
            }
          }
        }
      } else if (ecosystem === "cargo") {
        const lines = content.split("\n");
        let inDeps = false;
        for (const line of lines) {
          if (line.startsWith("[dependencies]") || line.startsWith("[dev-dependencies]")) {
            inDeps = true;
          } else if (line.startsWith("[")) {
            inDeps = false;
          } else if (inDeps && line.includes("=")) {
            const [name, val] = line.split("=");
            deps.push({
              name: name.trim(),
              version: val?.replace(/["']/g, "").trim() || "*",
              ecosystem: "cargo",
            });
          }
        }
      } else if (ecosystem === "go") {
        const lines = content.split("\n");
        let inRequire = false;
        for (const line of lines) {
          if (line.startsWith("require (")) inRequire = true;
          else if (inRequire && line.includes(")")) inRequire = false;
          else if (inRequire) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              deps.push({
                name: parts[0],
                version: parts[1],
                ecosystem: "go",
              });
            }
          }
        }
      }
    } catch {
      // Ignored: best-effort parsing
    }

    return deps;
  }

  static verifyLock(rootPath: string): LockfileVerificationResult {
    const lockfilePath = path.join(rootPath, "poly.lock");
    if (!fs.existsSync(lockfilePath)) {
      return {
        valid: false,
        driftDetected: false,
        membersCount: 0,
        error: "poly.lock not found",
      };
    }

    try {
      const content = fs.readFileSync(lockfilePath, "utf-8");
      const hashMatch = content.match(/hash\s*=\s*"([^"]+)"/);
      const membersMatch = content.match(/\[\[members\]\]/g);

      return {
        valid: true,
        hash: hashMatch ? hashMatch[1] : undefined,
        driftDetected: false,
        membersCount: membersMatch ? membersMatch.length : 0,
      };
    } catch (e) {
      return { valid: false, driftDetected: true, membersCount: 0, error: String(e) };
    }
  }
}
