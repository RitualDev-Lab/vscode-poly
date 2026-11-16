import * as vscode from "vscode";
import { PolyRunner } from "../runner.js";

export class PolyHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    const config = vscode.workspace.getConfiguration("poly");
    if (!config.get<boolean>("enableHover", true)) {
      return null;
    }

    const range = document.getWordRangeAtPosition(position, /[@a-zA-Z0-9_./-]+/);
    if (!range) return null;

    const word = document.getText(range);
    const fileName = document.fileName.toLowerCase();

    let ecosystem = "";
    if (fileName.endsWith("package.json")) ecosystem = "npm";
    else if (fileName.endsWith("pyproject.toml") || fileName.endsWith("requirements.txt"))
      ecosystem = "pypi";
    else if (fileName.endsWith("cargo.toml")) ecosystem = "cargo";
    else if (fileName.endsWith("go.mod")) ecosystem = "go";

    if (!ecosystem) return null;

    // Check if hovered word looks like a package identifier
    const lineText = document.lineAt(position.line).text;
    if (!lineText.includes(word)) return null;

    // Avoid triggering on JSON keys like 'scripts', 'dependencies', etc.
    const ignoredKeywords = [
      "dependencies",
      "devdependencies",
      "scripts",
      "version",
      "name",
      "project",
    ];
    if (ignoredKeywords.includes(word.toLowerCase())) return null;

    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const lockInfo = ws ? PolyRunner.verifyLock(ws) : undefined;

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    md.appendMarkdown("### ⚡ Poly Dependency Inspector\n\n");
    md.appendMarkdown(`- **Package:** \`${word}\`\n`);
    md.appendMarkdown(`- **Ecosystem:** \`${ecosystem}\`\n`);
    md.appendMarkdown(
      `- **Composite poly.lock:** ${
        lockInfo?.valid
          ? "🔒 Cryptographically Verified (SHA-256)"
          : "⚠️ Not tracked or drift detected"
      }\n\n`,
    );
    md.appendMarkdown("---\n");
    md.appendMarkdown(
      "[⚡ Install/Sync](command:poly.install) &nbsp;|&nbsp; [🩺 Doctor](command:poly.doctor) &nbsp;|&nbsp; [🛡️ Auto-Heal](command:poly.fix)",
    );

    return new vscode.Hover(md, range);
  }
}
