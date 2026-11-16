import * as vscode from "vscode";
import { PolyRunner } from "./runner.js";
import type { PolyHealthProvider } from "./tree/healthProvider.js";
import type { PolyWorkspaceProvider } from "./tree/workspaceProvider.js";

export function registerCommands(
  context: vscode.ExtensionContext,
  workspaceProvider: PolyWorkspaceProvider,
  healthProvider: PolyHealthProvider,
  onStateChange: () => void,
): void {
  // Command: Refresh
  context.subscriptions.push(
    vscode.commands.registerCommand("poly.refresh", () => {
      workspaceProvider.refresh();
      healthProvider.refresh();
      onStateChange();
      vscode.window.showInformationMessage("Poly: Workspace and health state refreshed.");
    }),
  );

  // Command: Add Dependency via PURL
  context.subscriptions.push(
    vscode.commands.registerCommand("poly.addDependency", async () => {
      const input = await vscode.window.showInputBox({
        title: "Poly: Add Polyglot Dependency",
        prompt:
          "Enter package name with ecosystem prefix (e.g. npm:zod, pypi:fastapi, cargo:tokio, go:github.com/gin-gonic/gin)",
        placeHolder: "npm:zod@latest",
        validateInput: (val) => {
          if (!val || !val.trim()) return "Package input cannot be empty";
          return null;
        },
      });

      if (input) {
        PolyRunner.runInTerminal(["add", input.trim()]);
      }
    }),
  );

  // Command: Install & Sync
  context.subscriptions.push(
    vscode.commands.registerCommand("poly.install", () => {
      PolyRunner.runInTerminal(["install"]);
    }),
  );

  // Command: Audit Security Vulnerabilities
  context.subscriptions.push(
    vscode.commands.registerCommand("poly.audit", () => {
      PolyRunner.runInTerminal(["audit"]);
    }),
  );

  // Command: Auto-Heal Vulnerabilities
  context.subscriptions.push(
    vscode.commands.registerCommand("poly.fix", () => {
      PolyRunner.runInTerminal(["fix"]);
    }),
  );

  // Command: Run System Diagnostics
  context.subscriptions.push(
    vscode.commands.registerCommand("poly.doctor", () => {
      PolyRunner.runInTerminal(["doctor"]);
    }),
  );

  // Command: Generate Multi-Stage Dockerfile & DevContainer
  context.subscriptions.push(
    vscode.commands.registerCommand("poly.docker", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: "Dockerfile + docker-compose.yml",
            description: "Multi-stage production build",
            devcontainer: false,
          },
          {
            label: "Dockerfile + DevContainer",
            description: "Multi-stage build with .devcontainer/devcontainer.json",
            devcontainer: true,
          },
        ],
        { placeHolder: "Select container artifact generator options" },
      );

      if (choice) {
        if (choice.devcontainer) {
          PolyRunner.runInTerminal(["docker", "--devcontainer"]);
        } else {
          PolyRunner.runInTerminal(["docker"]);
        }
      }
    }),
  );

  // Command: Verify poly.lock Cryptographic Integrity
  context.subscriptions.push(
    vscode.commands.registerCommand("poly.verifyLock", () => {
      const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!ws) {
        vscode.window.showErrorMessage("Poly: No active workspace folder.");
        return;
      }

      const res = PolyRunner.verifyLock(ws);
      if (res.valid) {
        vscode.window.showInformationMessage(
          `Poly: poly.lock integrity verified! (${res.membersCount} members, hash: ${res.hash?.slice(0, 16)}...)`,
        );
      } else {
        vscode.window.showWarningMessage(
          `Poly: Lockfile check failed - ${res.error || "tampering or drift detected"}`,
        );
      }
    }),
  );
}
