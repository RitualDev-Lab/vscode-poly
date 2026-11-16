import * as path from "node:path";
import * as vscode from "vscode";
import { PolyRunner } from "../runner.js";
import type { DependencyInfo, WorkspaceMemberInfo } from "../types.js";

export class PolyTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly member?: WorkspaceMemberInfo,
    public readonly dependency?: DependencyInfo,
  ) {
    super(label, collapsibleState);

    if (member) {
      this.contextValue = "workspaceMember";
      this.tooltip = `Ecosystem: ${member.ecosystem.toUpperCase()} | Path: ${member.relativeDir}`;
      this.description = member.ecosystem;

      // Assign theme icons per ecosystem
      switch (member.ecosystem) {
        case "npm":
          this.iconPath = new vscode.ThemeIcon(
            "symbol-class",
            new vscode.ThemeColor("terminal.ansiCyan"),
          );
          break;
        case "pypi":
          this.iconPath = new vscode.ThemeIcon(
            "symbol-method",
            new vscode.ThemeColor("terminal.ansiGreen"),
          );
          break;
        case "cargo":
          this.iconPath = new vscode.ThemeIcon(
            "package",
            new vscode.ThemeColor("terminal.ansiYellow"),
          );
          break;
        case "go":
          this.iconPath = new vscode.ThemeIcon(
            "file-code",
            new vscode.ThemeColor("terminal.ansiBlue"),
          );
          break;
      }
    } else if (dependency) {
      this.contextValue = "dependency";
      this.description = dependency.version;
      this.tooltip = `${dependency.name} (${dependency.version}) [${dependency.ecosystem}]`;

      if (dependency.hasVulnerability) {
        this.iconPath = new vscode.ThemeIcon("alert", new vscode.ThemeColor("errorForeground"));
        this.tooltip = `⚠️ Vulnerable dependency: ${dependency.name}`;
      } else {
        this.iconPath = new vscode.ThemeIcon("symbol-variable");
      }
    }
  }
}

export class PolyWorkspaceProvider implements vscode.TreeDataProvider<PolyTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PolyTreeItem | undefined | null | void> =
    new vscode.EventEmitter<PolyTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<PolyTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private members: WorkspaceMemberInfo[] = [];

  constructor(private workspaceRoot: string | undefined) {
    this.refresh();
  }

  refresh(): void {
    if (this.workspaceRoot) {
      this.members = PolyRunner.discoverWorkspace(this.workspaceRoot);
    } else {
      this.members = [];
    }
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PolyTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: PolyTreeItem): Thenable<PolyTreeItem[]> {
    if (!this.workspaceRoot) {
      return Promise.resolve([]);
    }

    if (!element) {
      // Return workspace members as top-level items
      if (this.members.length === 0) {
        const emptyItem = new PolyTreeItem(
          "No Poly members found",
          vscode.TreeItemCollapsibleState.None,
        );
        emptyItem.description = "Create poly.toml to start";
        return Promise.resolve([emptyItem]);
      }

      return Promise.resolve(
        this.members.map((m) => {
          const hasChildren = m.dependencies.length > 0;
          return new PolyTreeItem(
            m.name,
            hasChildren
              ? vscode.TreeItemCollapsibleState.Collapsed
              : vscode.TreeItemCollapsibleState.None,
            m,
          );
        }),
      );
    }

    // Children of a workspace member: list dependencies
    if (element.member) {
      const deps = element.member.dependencies;
      return Promise.resolve(
        deps.map(
          (d) => new PolyTreeItem(d.name, vscode.TreeItemCollapsibleState.None, undefined, d),
        ),
      );
    }

    return Promise.resolve([]);
  }
}
