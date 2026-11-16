import * as vscode from "vscode";
import { PolyRunner } from "../runner.js";

export class PolyStatusBar implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBarItem.command = "poly.doctor";
    this.update();
    this.statusBarItem.show();
  }

  update(): void {
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!ws) {
      this.statusBarItem.text = "$(zap) Poly";
      this.statusBarItem.tooltip = "Poly: Open a workspace to orchestrate multi-stack dependencies";
      return;
    }

    const lockResult = PolyRunner.verifyLock(ws);
    if (!lockResult.valid) {
      this.statusBarItem.text = "$(warning) Poly: Lockfile Drift";
      this.statusBarItem.tooltip =
        "poly.lock is out of sync or missing. Click to run poly install or doctor.";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    } else {
      this.statusBarItem.text = "$(zap) Poly: Ready";
      this.statusBarItem.tooltip = `Poly: Monorepo locked (${lockResult.membersCount} members, SHA-256 verified).\nClick to run poly doctor.`;
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
