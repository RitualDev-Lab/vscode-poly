import * as vscode from "vscode";
import { registerCommands } from "./commands.js";
import { PolyHoverProvider } from "./features/hoverProvider.js";
import { PolyStatusBar } from "./features/statusBar.js";
import { PolyHealthProvider } from "./tree/healthProvider.js";
import { PolyWorkspaceProvider } from "./tree/workspaceProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  // 1. Providers
  const workspaceProvider = new PolyWorkspaceProvider(wsRoot);
  const healthProvider = new PolyHealthProvider(wsRoot);
  const statusBar = new PolyStatusBar();

  // 2. Tree Views in Activity Bar
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("poly.workspaceView", workspaceProvider),
    vscode.window.registerTreeDataProvider("poly.healthView", healthProvider),
  );

  // 3. Status Bar
  context.subscriptions.push(statusBar);

  // 4. Hover Provider for manifest files
  const documentSelectors: vscode.DocumentFilter[] = [
    { pattern: "**/package.json" },
    { pattern: "**/pyproject.toml" },
    { pattern: "**/Cargo.toml" },
    { pattern: "**/go.mod" },
  ];
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(documentSelectors, new PolyHoverProvider()),
  );

  // 5. Register Commands
  registerCommands(context, workspaceProvider, healthProvider, () => {
    statusBar.update();
  });

  // 6. Watchers for workspace manifests and lockfile changes
  const watcher = vscode.workspace.createFileSystemWatcher("**/poly.{lock,toml}");
  watcher.onDidChange(() => {
    workspaceProvider.refresh();
    statusBar.update();
  });
  watcher.onDidCreate(() => {
    workspaceProvider.refresh();
    statusBar.update();
  });
  watcher.onDidDelete(() => {
    workspaceProvider.refresh();
    statusBar.update();
  });
  context.subscriptions.push(watcher);
}

export function deactivate(): void {}
