import * as vscode from "vscode";
import { PolyRunner } from "../runner.js";
import type { DiagnosticCheckItem, SystemHealthReport } from "../types.js";

export class HealthTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly item?: DiagnosticCheckItem,
  ) {
    super(label, collapsibleState);

    if (item) {
      this.contextValue = "healthCheck";
      this.description =
        item.version || (item.latencyMs ? `${item.latencyMs}ms` : item.message || "OK");
      this.tooltip = `${item.name}: ${this.description}`;

      if (item.status === "ok") {
        this.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("terminal.ansiGreen"));
      } else if (item.status === "warn") {
        this.iconPath = new vscode.ThemeIcon(
          "warning",
          new vscode.ThemeColor("terminal.ansiYellow"),
        );
      } else {
        this.iconPath = new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"));
      }
    }
  }
}

export class PolyHealthProvider implements vscode.TreeDataProvider<HealthTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HealthTreeItem | undefined | null | void> =
    new vscode.EventEmitter<HealthTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<HealthTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private report: SystemHealthReport | undefined;

  constructor(private workspaceRoot: string | undefined) {
    this.refresh();
  }

  async refresh(): Promise<void> {
    if (this.workspaceRoot) {
      try {
        this.report = await PolyRunner.getDoctorReport(this.workspaceRoot);
      } catch {
        this.report = undefined;
      }
    }
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HealthTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HealthTreeItem): Thenable<HealthTreeItem[]> {
    if (!this.report) {
      const loadingItem = new HealthTreeItem(
        "Diagnosing System Health...",
        vscode.TreeItemCollapsibleState.None,
      );
      loadingItem.iconPath = new vscode.ThemeIcon("sync~spin");
      return Promise.resolve([loadingItem]);
    }

    if (!element) {
      const items: HealthTreeItem[] = [];

      items.push(
        new HealthTreeItem(
          "Node.js Runtime",
          vscode.TreeItemCollapsibleState.None,
          this.report.node,
        ),
      );
      items.push(
        new HealthTreeItem(
          "Python / Astral uv",
          vscode.TreeItemCollapsibleState.None,
          this.report.python,
        ),
      );
      items.push(
        new HealthTreeItem("Rust / Cargo", vscode.TreeItemCollapsibleState.None, this.report.rust),
      );
      items.push(
        new HealthTreeItem("Go Compiler", vscode.TreeItemCollapsibleState.None, this.report.go),
      );
      items.push(
        new HealthTreeItem(
          "Native C/C++ Compiler",
          vscode.TreeItemCollapsibleState.None,
          this.report.nativeCompiler,
        ),
      );
      items.push(
        new HealthTreeItem(
          "poly.lock Integrity",
          vscode.TreeItemCollapsibleState.None,
          this.report.lockfileIntegrity,
        ),
      );

      if (this.report.registries && this.report.registries.length > 0) {
        const regParent = new HealthTreeItem(
          "Enterprise Registries",
          vscode.TreeItemCollapsibleState.Expanded,
        );
        regParent.iconPath = new vscode.ThemeIcon("cloud");
        items.push(regParent);
      }

      return Promise.resolve(items);
    }

    if (element.label === "Enterprise Registries" && this.report.registries) {
      return Promise.resolve(
        this.report.registries.map(
          (r) => new HealthTreeItem(r.name, vscode.TreeItemCollapsibleState.None, r),
        ),
      );
    }

    return Promise.resolve([]);
  }
}
